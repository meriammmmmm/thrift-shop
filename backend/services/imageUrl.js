/**
 * Image handling for the storefront API.
 *
 * Product photos were historically pasted straight into the `images` column as
 * base64 data URIs. A catalogue of ~90 products carried 16 MB of base64, so
 * every storefront response carried 17 MB of JSON — including the photos of
 * products far below the fold — and the browser had to download all of it
 * before the page could settle.
 *
 * The bytes are still in the database; they are simply served as images now.
 * The JSON only carries a URL, which the browser downloads in parallel, caches
 * like any other asset, and only fetches once the picture scrolls into view.
 */

const crypto = require('crypto');

const DATA_URI = /^data:([^;,]+)?(;base64)?,(.*)$/s;

/** Is this string an inline data URI rather than a URL? */
const isDataUri = (value) =>
  typeof value === 'string' && /^data:/i.test(value.trim());

/**
 * Unwrap the `images` column into a flat list of image entries.
 *
 * The column has been written three different ways over the years: a real
 * array, a JSON-encoded array, and — for a batch of imported rows — a
 * JSON-encoded array that was then JSON-encoded *again*. All three have to
 * resolve to the same list here, because the position in that list is what the
 * image route uses to find the bytes again.
 */
function parseImageList(raw) {
  let value = raw;

  for (let depth = 0; depth < 3; depth++) {
    if (value === null || value === undefined) return [];
    if (Array.isArray(value)) {
      return value.filter(
        (entry) => typeof entry === 'string' && entry.trim().length > 0
      );
    }
    if (typeof value !== 'string') return [];

    const text = value.trim();
    if (!text) return [];

    if (text.startsWith('[') || text.startsWith('"')) {
      try {
        value = JSON.parse(text);
        continue;
      } catch {
        return [text];
      }
    }

    return [text];
  }

  return [];
}

/** Split a data URI into its mime type and raw bytes. */
function decodeDataUri(value) {
  const match = DATA_URI.exec(String(value).trim());
  if (!match) return null;

  const mime = match[1] || 'image/jpeg';
  const payload = match[3] || '';
  if (!payload) return null;

  const buffer = match[2]
    ? Buffer.from(payload, 'base64')
    : Buffer.from(decodeURIComponent(payload), 'utf8');

  if (!buffer.length) return null;

  return { mime, buffer };
}

/**
 * The public base URL of this API, e.g. `https://backend-…fly.dev/api`.
 *
 * `PUBLIC_API_URL` wins when it is set. Otherwise the URL is derived from the
 * request, which keeps the correct host in every deployment without needing
 * one more secret to keep in sync.
 */
function publicBaseUrl(req) {
  const configured = process.env.PUBLIC_API_URL;
  if (configured) return configured.replace(/\/+$/, '');

  const forwardedProto = String(req.headers?.['x-forwarded-proto'] || '')
    .split(',')[0]
    .trim();
  const proto = forwardedProto || req.protocol || 'https';

  const forwardedHost = String(req.headers?.['x-forwarded-host'] || '')
    .split(',')[0]
    .trim();
  const host = forwardedHost || (req.get && req.get('host')) || '';

  return `${proto}://${host}/api`;
}

/** The URL that serves one image of a product. */
const productImageUrl = (baseUrl, productId, index) =>
  `${baseUrl}/products/image/${productId}/${index}`;

/**
 * Rewrite one image entry: an inline data URI becomes a link to the image
 * route, anything that is already a URL is left untouched.
 */
function rewriteImageEntry(entry, productId, index, baseUrl) {
  return isDataUri(entry) ? productImageUrl(baseUrl, productId, index) : entry;
}

/**
 * Replace every inline data URI in a product's images with a real URL.
 *
 * The product row is updated in place — the response shape stays exactly the
 * same, only the contents of `images` change from megabytes of base64 to a
 * list of links.
 */
function rewriteProductImages(product, baseUrl) {
  if (!product || product.images === null || product.images === undefined) {
    return product;
  }

  const entries = parseImageList(product.images);
  product.images = entries.map((entry, index) =>
    rewriteImageEntry(entry, product.id, index, baseUrl)
  );

  return product;
}

/**
 * The URL of a product's first usable image, or null when it has none.
 */
function firstProductImageUrl(productId, images, baseUrl) {
  const entries = parseImageList(images);
  if (!entries.length) return null;

  const index = entries.findIndex((entry) => entry.trim().length > 0);
  if (index === -1) return null;

  const entry = entries[index];
  return isDataUri(entry) ? productImageUrl(baseUrl, productId, index) : entry;
}

/** A strong ETag for an image body, so a repeat request costs 304 bytes. */
const imageEtag = (buffer) =>
  `"${crypto.createHash('sha1').update(buffer).digest('hex')}"`;

module.exports = {
  isDataUri,
  parseImageList,
  decodeDataUri,
  publicBaseUrl,
  productImageUrl,
  rewriteImageEntry,
  rewriteProductImages,
  firstProductImageUrl,
  imageEtag,
};
