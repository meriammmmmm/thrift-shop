const express = require('express');
const axios = require('axios');
const { Blob } = require('buffer'); // works on Node 18+ regardless of global
const router = express.Router();

// ---------------------------------------------------------------------------
// Virtual try-on via Hugging Face "Kolors Virtual Try-On" — 100% FREE.
// No billing, no credit card. It runs on a shared public GPU Space, so it can
// be slow or busy; the first try wakes the GPU, a second try is usually quick.
//
// Optional: set HF_TOKEN (free from https://huggingface.co/settings/tokens)
// for higher priority / fewer "GPU busy" errors. It is NOT required.
// ---------------------------------------------------------------------------

const HF_SPACE = process.env.HF_TRYON_SPACE || 'Kwai-Kolors/Kolors-Virtual-Try-On';
const HF_TOKEN = process.env.HF_TOKEN || undefined;

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
async function getClient() {
  const { Client } = await import('@gradio/client');
  return Client.connect(HF_SPACE, HF_TOKEN ? { hf_token: HF_TOKEN } : undefined);
}

function withTimeout(promise, ms, label) {
  let t;
  const timeout = new Promise((_, reject) => {
    t = setTimeout(() => reject(new Error(`${label} timed out`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(t));
}

router.post('/', async (req, res) => {
  const { model_image, garment_image } = req.body || {};
  if (!model_image || !garment_image) {
    return res.status(400).json({ error: 'A photo and a product are both required.' });
  }

  try {
    const [personBlob, garmentBlob] = await Promise.all([
      toBlob(model_image),
      toBlob(garment_image),
    ]);

    // Single attempt with sane timeouts so the request returns a real result or
    // a clean error fast (instead of hanging, which Railway turns into a 502).
    // If the GPU was asleep, the first click wakes it and the user clicks again.
    const client = await withTimeout(getClient(), 30000, 'Connecting to the try-on service');

    // Kolors "/tryon": person_img, garment_img, seed, randomize_seed
    //   -> returns [ resultImage (FileData), usedSeed ]
    const result = await withTimeout(
      client.predict('/tryon', {
        person_img: personBlob,
        garment_img: garmentBlob,
        seed: 0,
        randomize_seed: true,
      }),
      100000,
      'The try-on',
    );

    const out = Array.isArray(result?.data) ? result.data[0] : null;
    const imageUrl =
      (out && (out.url || out.path)) || (typeof out === 'string' ? out : null);

    if (!imageUrl) {
      return res.status(422).json({
        error: 'Could not generate a try-on for this combination. Try another photo or item.',
      });
    }

    const img = await axios.get(imageUrl, { responseType: 'arraybuffer', timeout: 60000 });
    const mime = img.headers['content-type'] || 'image/png';
    const dataUrl = `data:${mime};base64,${Buffer.from(img.data).toString('base64')}`;
    return res.json({ image: dataUrl });
  } catch (err) {
    const raw = (err && (err.message || String(err))) || 'Try-on failed.';
    console.error('Try-on error:', raw);

    let msg = raw;
    if (/quota|gpu|exceeded/i.test(raw)) {
      msg = 'The free try-on service is busy right now (shared GPU). Please try again in a minute.';
    } else if (/queue|full|429/i.test(raw)) {
      msg = 'The free try-on queue is full at the moment. Please try again shortly.';
    } else if (/timed out|connect|fetch|ENOTFOUND|timeout|ETIMEDOUT/i.test(raw)) {
      msg = 'The free GPU is waking up. Wait ~20s and tap "Try it on me" again — the second try is usually fast.';
    }
    return res.status(503).json({ error: msg });
  }
});

// Diagnostic: confirms the route is live and which Space it uses.
router.get('/health', async (req, res) => {
  const out = {
    provider: 'huggingface',
    space: HF_SPACE,
    hasHfToken: !!HF_TOKEN,
    free: true,
  };
  try {
    await getClient();
    out.spaceReachable = true;
  } catch (err) {
    out.spaceReachable = false;
    out.error = (err && err.message) || String(err);
  }
  return res.json(out);
});

module.exports = router;
