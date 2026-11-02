const express = require('express');
const { requireAdmin } = require('../middleware/auth');
const { parseDataUri, isHeic, convertHeic } = require('../services/imageConvert');

const router = express.Router();

/**
 * Image preparation for the admin panel.
 *
 * Photos taken on an iPhone arrive as HEIC — a format no browser can draw.
 * Stored as they are, the storefront shows a broken image where the outfit
 * should be. The panel sends those here and gets back an ordinary image
 * that every browser understands.
 */
router.post('/convert', requireAdmin, async (req, res) => {
  const { dataUri, mime } = req.body || {};

  const parsed = parseDataUri(dataUri);
  if (!parsed) {
    return res.status(400).json({ error: 'Send the image as a data URI' });
  }

  // Nothing to do — this is already a format the browser can draw.
  if (!isHeic({ mime: parsed.mime, declared: mime })) {
    return res.json({ dataUri, converted: false });
  }

  try {
    const converted = await convertHeic(parsed.buffer);

    return res.json({
      dataUri: `data:${converted.mime};base64,${converted.buffer.toString('base64')}`,
      converted: true,
      bytes: converted.buffer.length,
    });
  } catch (error) {
    console.error('❌ HEIC conversion failed:', error.message);
    return res.status(422).json({
      error: 'That photo could not be converted — please upload it as a JPG or PNG.',
    });
  }
});

module.exports = router;
