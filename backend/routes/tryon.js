const express = require('express');
const axios = require('axios');
const router = express.Router();

// Virtual try-on via Google's free Gemini image model.
// Reuses the backend's existing GEMINI_API_KEY (no new variable needed).
const MODEL = process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image';

function parseDataUrl(input) {
  const m = /^data:(.+?);base64,([\s\S]*)$/.exec(input);
  if (m) return { mime: m[1], data: m[2] };
  return { mime: 'image/jpeg', data: input };
}

async function urlToBase64(url) {
  const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 30000 });
  const mime = res.headers['content-type'] || 'image/jpeg';
  return { mime, data: Buffer.from(res.data).toString('base64') };
}

router.post('/', async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Try-on is not configured (missing GEMINI_API_KEY).' });
  }

  const { model_image, garment_image } = req.body || {};
  if (!model_image || !garment_image) {
    return res.status(400).json({ error: 'A photo and a product are both required.' });
  }

  try {
    const person = parseDataUrl(model_image);
    const garment = String(garment_image).startsWith('data:')
      ? parseDataUrl(garment_image)
      : await urlToBase64(garment_image);

    const prompt =
      'You are a virtual clothing try-on tool. The FIRST image is a person. ' +
      'The SECOND image is a clothing item. Generate a single photorealistic image ' +
      'of the same person wearing the clothing item from the second image. Keep the ' +
      "person's face, hair, body shape, pose, skin tone and the background unchanged. " +
      'Replace only the relevant clothing so it fits naturally with realistic folds, ' +
      'lighting and shadows. Return only the resulting image.';

    const gRes = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {
        contents: [
          {
            parts: [
              { text: prompt },
              { inline_data: { mime_type: person.mime, data: person.data } },
              { inline_data: { mime_type: garment.mime, data: garment.data } },
            ],
          },
        ],
        generationConfig: { responseModalities: ['IMAGE'] },
      },
      {
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        timeout: 120000,
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      },
    );

    const parts = gRes.data?.candidates?.[0]?.content?.parts || [];
    const imgPart = parts.find((p) => p.inlineData?.data || p.inline_data?.data);
    const inline = imgPart && (imgPart.inlineData || imgPart.inline_data);

    if (!inline || !inline.data) {
      const txt = parts.find((p) => p.text);
      return res.status(422).json({
        error: (txt && txt.text) || 'Could not generate a try-on for this combination. Try another photo or item.',
      });
    }

    const mime = inline.mimeType || inline.mime_type || 'image/png';
    return res.json({ image: `data:${mime};base64,${inline.data}` });
  } catch (err) {
    const status = err.response?.status || 500;
    const msg = err.response?.data?.error?.message || err.message || 'Try-on failed.';
    console.error('Try-on error:', msg);
    return res.status(status).json({ error: msg });
  }
});

// Diagnostic: confirms the key is loaded and the model is reachable.
// Does NOT expose the key value. Visit /api/tryon/health in a browser.
router.get('/health', async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  const out = {
    hasKey: !!apiKey,
    keyPrefix: apiKey ? apiKey.slice(0, 4) : null,
    keyLength: apiKey ? apiKey.length : 0,
    model: MODEL,
  };
  if (!apiKey) return res.json(out);
  try {
    const r = await axios.get('https://generativelanguage.googleapis.com/v1beta/models', {
      headers: { 'x-goog-api-key': apiKey },
      timeout: 20000,
    });
    const names = (r.data?.models || []).map((m) => m.name || '');
    out.keyValid = true;
    out.modelAvailable = names.some((n) => n.includes(MODEL));
    out.imageModels = names.filter((n) => /image/i.test(n));
  } catch (err) {
    out.keyValid = false;
    out.authStatus = err.response?.status || null;
    out.authError = err.response?.data?.error?.message || err.message;
  }
  return res.json(out);
});

module.exports = router;

