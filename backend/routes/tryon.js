const express = require('express');
const axios = require('axios');
const { Blob } = require('buffer'); // works on Node 18+ regardless of global
const router = express.Router();

// ---------------------------------------------------------------------------
// Virtual try-on via Hugging Face "Kolors Virtual Try-On" — 100% FREE.
// No billing, no credit card. It runs on a shared public GPU Space, so it can
// be slow or busy. To make the single "Try it on me" button reliable, this
// endpoint now does the patient retrying ON THE SERVER:
//   * it retries through the GPU "wake up" / "queue full" phase with backoff,
//   * it automatically falls back to alternate free Spaces if one is busy,
//   * it tolerates small differences in the Space's API (param names / output).
// The user clicks once; the server keeps trying within a safe time budget.
//
// Optional: set HF_TOKEN (free from https://huggingface.co/settings/tokens)
// for higher priority / fewer "GPU busy" errors. It is NOT required.
// ---------------------------------------------------------------------------

// Primary first, then fallbacks. Override the primary with HF_TRYON_SPACE.
// All are free Kolors Virtual Try-On Spaces (the fallbacks are public mirrors).
const PRIMARY_SPACE = process.env.HF_TRYON_SPACE || 'Kwai-Kolors/Kolors-Virtual-Try-On';
const SPACES = [
  PRIMARY_SPACE,
  'zhengchong/Kolors-Virtual-Try-On',
  'fffiloni/Kolors-Virtual-Try-On',
].filter((s, i, arr) => s && arr.indexOf(s) === i); // de-dupe, keep order

const HF_TOKEN = process.env.HF_TOKEN || undefined;

// Total time we are willing to spend retrying before returning a clean error.
// Kept under typical platform request limits so we never get cut into a 502.
const TOTAL_BUDGET_MS = Number(process.env.TRYON_BUDGET_MS || 115000);
const CONNECT_TIMEOUT_MS = 30000;
const PREDICT_TIMEOUT_MS = 60000;

function parseImageInput(input) {
  const m = /^data:(.+?);base64,([\s\S]*)$/.exec(String(input));
  if (m) return { mime: m[1], buffer: Buffer.from(m[2], 'base64') };
  return { mime: 'image/jpeg', buffer: Buffer.from(String(input), 'base64') };
}

async function urlToBuffer(url) {
  const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 30000 });
  const mime = res.headers['content-type'] || 'image/jpeg';
  return { mime, buffer: Buffer.from(res.data) };
}

async function toBlob(input) {
  const { mime, buffer } =
    String(input).startsWith('http') ? await urlToBuffer(input) : parseImageInput(input);
  return new Blob([buffer], { type: mime });
}

// @gradio/client is ESM-only, so we import it dynamically from this CJS file.
async function getClient(space) {
  const { Client } = await import('@gradio/client');
  return Client.connect(space, HF_TOKEN ? { hf_token: HF_TOKEN } : undefined);
}

function withTimeout(promise, ms, label) {
  let t;
  const timeout = new Promise((_, reject) => {
    t = setTimeout(() => reject(new Error(`${label} timed out`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(t));
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Errors that mean "shared GPU is busy / waking up" — worth retrying.
const RETRYABLE = /quota|gpu|exceeded|queue|full|429|timed out|timeout|ETIMEDOUT|ENOTFOUND|fetch|connect|busy|waking|503|502|loading/i;

// Pull a usable image URL out of whatever shape the Space returns.
function extractImageUrl(result) {
  const data = result && result.data;
  const candidates = [];
  if (Array.isArray(data)) candidates.push(...data);
  else if (data) candidates.push(data);
  candidates.push(result);

  for (const c of candidates) {
    if (!c) continue;
    if (typeof c === 'string' && /^https?:|^data:/.test(c)) return c;
    if (typeof c === 'object') {
      if (typeof c.url === 'string') return c.url;
      if (typeof c.path === 'string' && /^https?:/.test(c.path)) return c.path;
      // some Spaces nest the file under .image / .value
      if (c.image && (c.image.url || c.image.path)) return c.image.url || c.image.path;
      if (c.value && (c.value.url || c.value.path)) return c.value.url || c.value.path;
    }
  }
  return null;
}

// One predict attempt against an already-connected client. Tries the named
// signature first, then a positional fallback if the Space rejects the params.
async function runPredict(client, personBlob, garmentBlob) {
  const named = {
    person_img: personBlob,
    garment_img: garmentBlob,
    seed: 0,
    randomize_seed: true,
  };
  try {
    return await withTimeout(
      client.predict('/tryon', named),
      PREDICT_TIMEOUT_MS,
      'The try-on',
    );
  } catch (e) {
    const m = (e && e.message) || '';
    // If it looks like a parameter / endpoint mismatch (not a busy GPU),
    // retry once with positional args, which most Kolors mirrors accept.
    if (/param|argument|endpoint|api_name|not found|unexpected|fn_index/i.test(m)) {
      return await withTimeout(
        client.predict('/tryon', [personBlob, garmentBlob, 0, true]),
        PREDICT_TIMEOUT_MS,
        'The try-on',
      );
    }
    throw e;
  }
}

router.post('/', async (req, res) => {
  const { model_image, garment_image } = req.body || {};
  if (!model_image || !garment_image) {
    return res.status(400).json({ error: 'A photo and a product are both required.' });
  }

  const deadline = Date.now() + TOTAL_BUDGET_MS;
  let lastErr = 'Try-on failed.';
  let attempt = 0;

  try {
    const [personBlob, garmentBlob] = await Promise.all([
      toBlob(model_image),
      toBlob(garment_image),
    ]);

    // Cycle through the Spaces, retrying each within the overall time budget.
    // This is the loop that makes a single click reliable: it absorbs the
    // GPU wake-up and short queue waits so the user doesn't have to re-click.
    while (Date.now() < deadline) {
      const space = SPACES[attempt % SPACES.length];
      attempt += 1;
      try {
        const client = await withTimeout(
          getClient(space),
          CONNECT_TIMEOUT_MS,
          'Connecting to the try-on service',
        );

        const result = await runPredict(client, personBlob, garmentBlob);
        const imageUrl = extractImageUrl(result);

        if (!imageUrl) {
          // Got a response but no image — treat as non-retryable bad combo.
          return res.status(422).json({
            error:
              'Could not generate a try-on for this combination. Try another photo or item.',
          });
        }

        const img = await axios.get(imageUrl, {
          responseType: 'arraybuffer',
          timeout: 60000,
        });
        const mime = img.headers['content-type'] || 'image/png';
        const dataUrl = `data:${mime};base64,${Buffer.from(img.data).toString('base64')}`;
        return res.json({ image: dataUrl, attempts: attempt, space });
      } catch (err) {
        lastErr = (err && (err.message || String(err))) || 'Try-on failed.';
        console.error(`Try-on attempt ${attempt} (${space}) failed:`, lastErr);

        // Non-retryable error → stop early.
        if (!RETRYABLE.test(lastErr)) break;

        // Backoff before the next attempt, but never blow past the budget.
        const remaining = deadline - Date.now();
        if (remaining <= 1500) break;
        await sleep(Math.min(4000 + attempt * 1000, remaining - 500));
      }
    }

    // Exhausted the budget or hit a hard error.
    let msg = lastErr;
    if (/quota|gpu|exceeded|busy/i.test(lastErr)) {
      msg =
        'The free try-on service is very busy right now (shared GPU). Please try again in a minute.';
    } else if (/queue|full|429/i.test(lastErr)) {
      msg = 'The free try-on queue is full at the moment. Please try again shortly.';
    } else if (/timed out|connect|fetch|ENOTFOUND|timeout|ETIMEDOUT|loading/i.test(lastErr)) {
      msg =
        'The free GPU is taking longer than usual to wake up. Please tap "Try it on me" once more.';
    }
    return res.status(503).json({ error: msg });
  } catch (err) {
    const raw = (err && (err.message || String(err))) || 'Try-on failed.';
    console.error('Try-on fatal error:', raw);
    return res.status(503).json({
      error: 'The free try-on service is unavailable right now. Please try again shortly.',
    });
  }
});

// Diagnostic: confirms the route is live and which Spaces it will use.
router.get('/health', async (req, res) => {
  const out = {
    provider: 'huggingface',
    spaces: SPACES,
    primary: SPACES[0],
    hasHfToken: !!HF_TOKEN,
    budgetMs: TOTAL_BUDGET_MS,
    free: true,
  };
  try {
    await withTimeout(getClient(SPACES[0]), CONNECT_TIMEOUT_MS, 'connect');
    out.spaceReachable = true;
  } catch (err) {
    out.spaceReachable = false;
    out.error = (err && err.message) || String(err);
  }
  return res.json(out);
});

module.exports = router;
