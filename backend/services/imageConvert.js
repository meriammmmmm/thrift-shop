/**
 * Turning the photos the merchant uploads into something a browser can draw.
 *
 * An iPhone photo arrives as HEIC. No browser can draw HEIC, so the
 * storefront would show a broken image where the outfit should be. The
 * admin panel sends those here and gets back an ordinary image.
 *
 * The photo is scaled down on the way through as well: a phone camera
 * photo is far larger than the storefront ever needs, and the panel has to
 * carry it inside a JSON body.
 */

const DATA_URI = /^data:([^;,]+)?(;base64)?,(.*)$/s;

/** The formats that have to be converted before a browser can show them. */
const HEIC_MIME = /^image\/(heic|heif|heic-sequence|heif-sequence|hevc)$/i;

/** The longest edge a stored photo is allowed to have. */
const MAX_EDGE = 1600;

/** How sharp a converted photo is kept. */
const JPEG_QUALITY = 86;

/** Split a data URI into its mime type and its bytes. */
function parseDataUri(value) {
  if (typeof value !== 'string') return null;

  const match = DATA_URI.exec(value.trim());
  if (!match) return null;

  const mime = (match[1] || 'application/octet-stream').toLowerCase();
  const payload = match[3] || '';
  if (!payload) return null;

  const base64 = match[2] ? payload : Buffer.from(decodeURIComponent(payload)).toString('base64');

  return { mime, buffer: Buffer.from(base64, 'base64') };
}

/** Is this data URI one the browser would choke on? */
function isHeic({ mime, declared }) {
  return HEIC_MIME.test(declared || '') || HEIC_MIME.test(mime || '');
}

/**
 * Scale a picture down, averaging the pixels that fall into each new one.
 *
 * Averaging (rather than dropping) keeps the fabric and the lace looking
 * like fabric and lace instead of a rash of coloured pixels.
 */
function downscaleRgba(source, sourceWidth, sourceHeight, targetWidth, targetHeight) {
  const output = Buffer.alloc(targetWidth * targetHeight * 4);
  const xRatio = sourceWidth / targetWidth;
  const yRatio = sourceHeight / targetHeight;
  let translucent = false;

  for (let y = 0; y < targetHeight; y++) {
    const y0 = Math.floor(y * yRatio);
    const y1 = Math.min(sourceHeight, Math.max(y0 + 1, Math.floor((y + 1) * yRatio)));

    for (let x = 0; x < targetWidth; x++) {
      const x0 = Math.floor(x * xRatio);
      const x1 = Math.min(sourceWidth, Math.max(x0 + 1, Math.floor((x + 1) * xRatio)));

      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      let count = 0;

      for (let sy = y0; sy < y1; sy++) {
        for (let sx = x0; sx < x1; sx++) {
          const index = (sy * sourceWidth + sx) * 4;
          r += source[index];
          g += source[index + 1];
          b += source[index + 2];
          a += source[index + 3];
          count++;
        }
      }

      const target = (y * targetWidth + x) * 4;
      output[target] = Math.round(r / count);
      output[target + 1] = Math.round(g / count);
      output[target + 2] = Math.round(b / count);
      output[target + 3] = Math.round(a / count);

      if (output[target + 3] < 255) translucent = true;
    }
  }

  return { pixels: output, translucent };
}

/** Turn a HEIC photo into something a browser can draw. */
async function convertHeic(buffer) {
  const heicDecode = require('heic-decode');
  const jpegJs = require('jpeg-js');
  const { PNG } = require('pngjs');

  const { width, height, data } = await heicDecode({ buffer });

  const longest = Math.max(width, height);
  const scale = longest > MAX_EDGE ? MAX_EDGE / longest : 1;
  const targetWidth = Math.max(1, Math.round(width * scale));
  const targetHeight = Math.max(1, Math.round(height * scale));

  const { pixels, translucent } = downscaleRgba(
    Buffer.from(data.buffer, data.byteOffset, data.byteLength),
    width,
    height,
    targetWidth,
    targetHeight
  );

  // A photo with a transparent edge is kept as a PNG — only that format
  // can hold the transparency.
  if (translucent) {
    const png = new PNG({ width: targetWidth, height: targetHeight });
    png.data = pixels;
    return {
      mime: 'image/png',
      buffer: PNG.sync.write(png, { deflateLevel: 9, inputHasAlpha: true }),
    };
  }

  return {
    mime: 'image/jpeg',
    buffer: jpegJs.encode(
      { data: pixels, width: targetWidth, height: targetHeight },
      JPEG_QUALITY
    ).data,
  };
}

module.exports = { parseDataUri, isHeic, convertHeic, downscaleRgba, MAX_EDGE };
