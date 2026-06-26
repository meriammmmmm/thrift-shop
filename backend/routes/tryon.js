const express = require('express');
const axios = require('axios');
const router = express.Router();

// ---------------------------------------------------------------------------
// Virtual try-on via Segmind "Try-On Diffusion" serverless API.
// Fast (~8s) and reliable — no shared-GPU queue. Uses free signup credits.
// Set SEGMIND_API_KEY in the backend's environment (Railway → Variables).
// ---------------------------------------------------------------------------

const SEGMIND_URL = 'https://api.segmind.com/v1/try-on-diffusion';
const VALID_CATEGORIES = ['Upper body', 'Lower body', 'Dress'];

// Segmind accepts either an image URL or a raw base64 string (no data: prefix).
// - http(s) URL  -> pass through (Segmind fetches it)
// - data URL     -> strip the "data:...;base64," prefix to raw base64
// - raw base64   -> pass through
function toSegmindImage(input) {
  const s = String(input);
  if (s.startsWith('http')) return s;
  const m = /^data:.+?;base64,([\s\S]*)$/.exec(s);
  return m ? m[1] : s;
}

router.post('/', async (req, res) => {
  const apiKey = process.env.SEGMIND_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Try-on is not configured (missing SEGMIND_API_KEY).' });
  }

  const { model_image, garment_image, category } = req.body || {};
  if (!model_image || !garment_image) {
    return res.status(400).json({ error: 'A photo and a product are both required.' });
  }

  const cat = VALID_CATEGORIES.includes(category) ? category : 'Upper body';

  try {
    const sRes = await axios.post(
      SEGMIND_URL,
      {
        model_image: toSegmindImage(model_image),
        cloth_image: toSegmindImage(garment_image),
        category: cat,
        num_inference_steps: 35,
        guidance_scale: 2,
        seed: Math.floor(Math.random() * 1000000000),
        base64: false,
      },
      {
        headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
        responseType: 'arraybuffer',
        timeout: 90000,
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      },
    );

    const mime = sRes.headers['content-type'] || 'image/jpeg';
    const dataUrl = `data:${mime};base64,${Buffer.from(sRes.data).toString('base64')}`;
    return res.json({ image: dataUrl });
  } catch (err) {
    const status = err.response?.status || 500;
    // Error body may be an arraybuffer (responseType) — decode it for a message.
    let detail = '';
    try {
      const d = err.response?.data;
      detail = Buffer.isBuffer(d) ? d.toString('utf8') : typeof d === 'string' ? d : JSON.stringify(d || {});
    } catch (_) {
      /* ignore */
    }
    console.error('Try-on error:', status, detail || err.message);

    let msg = 'Try-on failed. Please try again.';
    if (status === 401 || status === 403) {
      msg = 'Try-on is not authorized — the SEGMIND_API_KEY looks invalid. Please check it.';
    } else if (status === 406) {
      msg = 'Out of free try-on credits. Add credits in your Segmind account to continue.';
    } else if (status === 429) {
      msg = 'Too many try-ons at once. Please wait a few seconds and try again.';
    } else if (status === 400) {
      msg = 'That photo or item could not be processed. Try a clearer, front-facing photo.';
    } else if (/timeout|ETIMEDOUT/i.test(err.message || '')) {
      msg = 'The try-on took too long. Please try again.';
    }
    return res.status(status === 500 ? 502 : status).json({ error: msg });
  }
});

// Diagnostic: confirms the key is loaded. Visit /api/tryon/health.
// Never exposes the key value, and does not spend credits.
router.get('/health', (req, res) => {
  const apiKey = process.env.SEGMIND_API_KEY;
  return res.json({
    provider: 'segmind',
    model: 'try-on-diffusion',
    hasKey: !!apiKey,
    keyLength: apiKey ? apiKey.length : 0,
  });
});

module.exports = router;
