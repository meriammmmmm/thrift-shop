const express = require('express');
const axios = require('axios');
const { Blob } = require('buffer'); // works on Node 18+ regardless of global
const router = express.Router();

// ---------------------------------------------------------------------------
// Virtual try-on via Hugging Face "Kolors Virtual Try-On" — 100% FREE.
// No billing, no credit card. It runs on a shared public GPU Space, so it can
// occasionally be slow or busy; we retry and return clear messages when it is.
//
// Optional: set HF_TOKEN (a free token from https://huggingface.co/settings/tokens)
// for higher priority / fewer "GPU busy" errors. It is NOT required.
// ---------------------------------------------------------------------------

const HF_SPACE = process.env.HF_TRYON_SPACE || 'Kwai-Kolors/Kolors-Virtual-Try-On';
const HF_TOKEN = process.env.HF_TOKEN || undefined;

// Turn a data URL or raw base64 string into a Buffer + mime type.
function parseImageInput(input) {
  const m = /^data:(.+?);base64,([\s\S]*)$/.exec(String(input));
  if (m) return { mime: m[1], buffer: Buffer.from(m[2], 'base64') };
  // raw base64 (no data: prefix)
  return { mime: 'image/jpeg', buffer: Buffer.from(String(input), 'base64') };
}

// Download a remote image (e.g. the product photo) into a Buffer.
async function urlToBuffer(url) {
  const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 30000 });
  const mime = res.headers['content-type'] || 'image/jpeg';
  return { mime, buffer: Buffer.from(res.data) };
}

// Resolve a model_image / garment_image (data URL OR http URL) into a Blob.
async function toBlob(input) {
  const { mime, buffer } =
    String(input).startsWith('http') ? await urlToBuffer(input) : parseImageInput(input);
  return new Blob([buffer], { type: mime });
}

// Connect to the Gradio Space. @gradio/client is ESM-only, so we import it
// dynamically from this CommonJS file.
async function getClient() {
  const { Client } = await import('@gradio/client');
  return Client.connect(HF_SPACE, HF_TOKEN ? { hf_token: HF_TOKEN } : undefined);
}

// Reject (instead of hanging or crashing) if a step takes too long.
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

    const client = await withTimeout(getClient(), 60000, 'Connecting to the try-on service');

    // Kolors "/tryon" signature:
    //   person_img (image), garment_img (image), seed (number), randomize_seed (bool)
    //   -> returns [ resultImage (FileData), usedSeed ]
    const result = await withTimeout(
      client.predict('/tryon', {
        person_img: personBlob,
        garment_img: garmentBlob,
        seed: 0,
        randomize_seed: true,
      }),
      240000,
      'The try-on',
    );

    const out = Array.isArray(result?.data) ? result.data[0] : null;
    // FileData from a Space is usually { url, path, ... }; sometimes a plain string.
    const imageUrl =
      (out && (out.url || out.path)) || (typeof out === 'string' ? out : null);

    if (!imageUrl) {
      return res.status(422).json({
        error: 'Could not generate a try-on for this combination. Try another photo or item.',
      });
    }

    // Convert the temporary Space URL into a self-contained data URL so the
    // browser can show it even after the Space cleans the file up.
    const img = await axios.get(imageUrl, { responseType: 'arraybuffer', timeout: 60000 });
    const mime = img.headers['content-type'] || 'image/png';
    const dataUrl = `data:${mime};base64,${Buffer.from(img.data).toString('base64')}`;

    return res.json({ image: dataUrl });
  } catch (err) {
    const raw = (err && (err.message || String(err))) || 'Try-on failed.';
    console.error('Try-on error:', raw);

    // Friendlier messages for the common shared-GPU situations.
    let msg = raw;
    if (/quota|gpu|exceeded/i.test(raw)) {
      msg = 'The free try-on service is busy right now (shared GPU limit). Please try again in a minute.';
    } else if (/queue|full|429/i.test(raw)) {
      msg = 'The free try-on queue is full at the moment. Please try again shortly.';
    } else if (/timed out|connect|fetch|ENOTFOUND|timeout|ETIMEDOUT/i.test(raw)) {
      msg = 'The try-on service is taking too long (it may be waking up). Please try again in a moment.';
    }
    return res.status(503).json({ error: msg });
  }
});

// Diagnostic: confirms the route is live and which Space it uses.
// Visit /api/tryon/health in a browser. Never exposes any secret value.
router.get('/health', async (req, res) => {
  const out = {
    provider: 'huggingface',
    space: HF_SPACE,
    hasHfToken: !!HF_TOKEN, // optional, only affects priority
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
