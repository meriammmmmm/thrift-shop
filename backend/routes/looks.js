const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { authenticateToken } = require('../middleware/auth');
const {
  isDataUri,
  decodeDataUri,
  publicBaseUrl,
  firstProductImageUrl,
  imageEtag,
} = require('../services/imageUrl');

/**
 * Styled looks — a photo of the complete outfit being worn plus the individual
 * catalogue products that make it up. Managed entirely from the admin panel and
 * read by the storefront's "Shop the Look" section.
 */

const companyOf = (req) => req.user?.admin_company_id || req.user?.company_id || 1;

/**
 * Pull the first usable image out of whatever shape the column holds.
 *
 * Product images have been stored three different ways over the years:
 * a real array, a JSON-encoded array, and — for a batch of imported rows —
 * a JSON-encoded array that was then JSON-encoded *again* ("[\"[\\\"url\\\"]\"]").
 * The old version only understood the first two, so those products rendered
 * as a broken image everywhere they appeared.
 *
 * The unwrapping now lives in `services/imageUrl`, which also knows how to
 * turn an inline base64 into a link to the image route.
 */

/* --------------------------------------------------------- worn-outfit photo */

/**
 * The worn photo used to be pasted into `looks.worn_image` as a base64 data
 * URI. A single portrait photo was ~3 MB of base64, which meant every
 * storefront page load pulled three megabytes of JSON before it could render
 * a single product.
 *
 * The bytes now live in `look_images` and are served from their own route,
 * so the list endpoints stay small and the browser can cache the image like
 * any other asset.
 */
const DATA_URI = /^data:([^;,]+)?(;base64)?,(.*)$/s;

/** Split a data URI into its mime type and raw base64 payload. */
function parseDataUri(value) {
  if (typeof value !== 'string') return null;
  const match = DATA_URI.exec(value.trim());
  if (!match) return null;

  const mime = match[1] || 'image/jpeg';
  const payload = match[3] || '';
  if (!payload) return null;

  return { mime, base64: match[2] ? payload : Buffer.from(decodeURIComponent(payload)).toString('base64') };
}

/** Persist the worn photo and return the path the storefront should use. */
async function storeWornImage(lookId, value) {
  if (!value) {
    await db.run(`DELETE FROM look_images WHERE look_id = ?`, [lookId]);
    return null;
  }

  const raw = String(value).trim();

  /**
   * The admin panel sends the stored path back untouched when the photo was
   * not changed (`/looks/12/worn-image`). That is not a new upload — the bytes
   * are already in `look_images` — so they are left exactly as they are.
   */
  if (raw === storedImagePath(lookId) || raw.endsWith(`/looks/${lookId}/worn-image`)) {
    const existing = await db.get(`SELECT look_id FROM look_images WHERE look_id = ?`, [lookId]);
    return existing ? storedImagePath(lookId) : null;
  }

  // An external URL is stored as-is on the look row.
  if (/^https?:\/\//i.test(raw)) {
    await db.run(`DELETE FROM look_images WHERE look_id = ?`, [lookId]);
    return raw;
  }

  const parsed = parseDataUri(raw);
  if (!parsed) {
    // Not an image we understand — drop it rather than serving garbage.
    await db.run(`DELETE FROM look_images WHERE look_id = ?`, [lookId]);
    return null;
  }

  await db.run(
    `DELETE FROM look_images WHERE look_id = ?`, [lookId]
  );
  await db.run(
    `INSERT INTO look_images (look_id, image, mime, updated_at)
     VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
    [lookId, parsed.base64, parsed.mime]
  );

  return `/looks/${lookId}/worn-image`;
}

/** The path the storefront uses for a look whose photo is stored server-side. */
const storedImagePath = (lookId) => `/looks/${lookId}/worn-image`;

/**
 * Move any legacy data URI out of `looks.worn_image` and into `look_images`.
 * Runs once per process, so the first request after a deploy repairs the
 * rows that were pasted in as base64.
 */
let backfillPromise = null;
function backfillWornImages() {
  if (backfillPromise) return backfillPromise;

  backfillPromise = (async () => {
    try {
      const rows = await db.all(
        `SELECT id, worn_image FROM looks WHERE worn_image LIKE 'data:%'`
      );
      if (!rows.length) return;

      for (const row of rows) {
        const stored = await storeWornImage(row.id, row.worn_image);
        if (stored) {
          await db.run(`UPDATE looks SET worn_image = NULL WHERE id = ?`, [row.id]);
        }
      }
      console.log(`✅ Moved ${rows.length} base64 look photo(s) into look_images`);
    } catch (error) {
      /**
       * A transient database error must not disable the repair for the rest of
       * the process — the promise is dropped so a later request tries again.
       */
      backfillPromise = null;
      console.warn('⚠️ look image backfill skipped:', error.message);
      throw error;
    }
  })();

  return backfillPromise;
}


/** Attach the look's products (with their first image) to each look row. */
async function withItems(looks, baseUrl) {
  if (!looks.length) return [];
  const ids = looks.map((l) => l.id);
  const placeholders = ids.map(() => '?').join(',');

  const rows = await db.all(
    `SELECT li.look_id, li.sort_order, li.product_id,
            p.name, p.price, p.original_price, p.category, p.color,
            p.brand, p.size, p.images, p.in_stock
       FROM look_items li
       LEFT JOIN products p ON p.id = li.product_id
      WHERE li.look_id IN (${placeholders})
      ORDER BY li.sort_order ASC, li.id ASC`,
    ids
  );

  // Which looks have their photo stored as an image row rather than a URL.
  const imageRows = await db.all(
    `SELECT look_id FROM look_images WHERE look_id IN (${placeholders})`,
    ids
  );
  const storedImages = new Set(imageRows.map((r) => Number(r.look_id)));

  const byLook = new Map(looks.map((l) => [l.id, { ...l, items: [] }]));
  for (const row of rows) {
    const target = byLook.get(row.look_id);
    if (!target) continue;
    if (!row.product_id) continue;
    target.items.push({
      product_id: row.product_id,
      name: row.name,
      price: row.price,
      original_price: row.original_price,
      category: row.category,
      color: row.color,
      brand: row.brand,
      size: row.size,
      in_stock: row.in_stock,
      image: firstProductImageUrl(row.product_id, row.images, baseUrl),
    });
  }

  return Array.from(byLook.values()).map((look) => ({
    ...look,
    /**
     * The worn photo is always handed out as a link, never as inline base64.
     * A look photo is ~3 MB of base64, and shipping it inside the list
     * response meant every storefront page load pulled megabytes of JSON
     * before it could render anything.
     */
    worn_image:
      storedImages.has(Number(look.id)) || isDataUri(look.worn_image)
        ? `${baseUrl}${storedImagePath(look.id)}`
        : look.worn_image || null,
  }));
}

/**
 * Store the worn photo for a look.
 *
 * A base64 upload goes into `look_images`; an external URL is kept on the
 * look row. Either way the row never holds a data URI.
 */
async function applyWornImage(lookId, wornImage) {
  const stored = await storeWornImage(lookId, wornImage);
  if (stored && stored.startsWith('http')) {
    await db.run(`UPDATE looks SET worn_image = ? WHERE id = ?`, [stored, lookId]);
  }
  return stored;
}

const normaliseItems = (items) =>
  (Array.isArray(items) ? items : [])
    .map((item) => Number(item?.product_id ?? item?.productId ?? item))
    .filter((id) => Number.isInteger(id) && id > 0);

async function replaceItems(lookId, productIds) {
  await db.run(`DELETE FROM look_items WHERE look_id = ?`, [lookId]);
  for (let i = 0; i < productIds.length; i++) {
    // ON CONFLICT DO NOTHING works on both SQLite (3.24+) and Postgres.
    await db.run(
      `INSERT INTO look_items (look_id, product_id, sort_order) VALUES (?, ?, ?)
         ON CONFLICT (look_id, product_id) DO NOTHING`,
      [lookId, productIds[i], i]
    );
  }
}

/* ------------------------------------------------------------------ public */

// The worn-outfit photo. Served as an image so the storefront can cache it
// and the list endpoints never carry megabytes of base64.
router.get('/:id/worn-image', async (req, res) => {
  try {
    const { id } = req.params;
    const row = await db.get(`SELECT image, mime FROM look_images WHERE look_id = ?`, [id]);

    let mime = row?.mime || null;
    let buffer = null;

    if (row?.image) {
      // `look_images` holds the base64 payload itself.
      buffer = Buffer.from(String(row.image), 'base64');
    } else {
      /**
       * Fall back to the legacy column. A photo pasted straight into
       * `looks.worn_image` has not been moved into `look_images` yet, so it is
       * served from there — the storefront still gets an image instead of
       * megabytes of base64 in the JSON.
       */
      const legacy = await db.get(`SELECT worn_image FROM looks WHERE id = ?`, [id]);
      if (legacy?.worn_image && isDataUri(legacy.worn_image)) {
        const decoded = decodeDataUri(legacy.worn_image);
        if (decoded) {
          mime = decoded.mime;
          buffer = decoded.buffer;
        }
      }
    }

    if (!buffer || !buffer.length) {
      return res.status(404).json({ success: false, error: 'No image for this look' });
    }

    const etag = imageEtag(buffer);

    res.setHeader('Content-Type', mime || 'image/jpeg');
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('ETag', etag);

    // A repeat visit costs a 304 instead of the whole picture.
    if (req.headers['if-none-match'] === etag) {
      return res.status(304).end();
    }

    return res.end(buffer);
  } catch (error) {
    console.error('Get look image error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch image' });
  }
});

// Active looks for the storefront — no auth required.
router.get('/active', async (req, res) => {
  try {
    const companyId = req.query.companyId || 1;

    /**
     * Repair any photo that is still sitting in the legacy column. It runs in
     * the background so a slow repair never delays the response.
     */
    backfillWornImages().catch(() => {});

    const looks = await db.all(
      `SELECT id, name, occasion, tagline, worn_image, display_order, created_at
         FROM looks
        WHERE company_id = ? AND is_active = true
        ORDER BY display_order ASC, created_at DESC`,
      [companyId]
    );

    res.json({
      success: true,
      looks: await withItems(looks, publicBaseUrl(req)),
    });
  } catch (error) {
    console.error('Get active looks error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch looks' });
  }
});

/* ------------------------------------------------------------------- admin */

// All looks for the admin list, including hidden ones.
router.get('/', authenticateToken, async (req, res) => {
  try {
    const companyId = req.query.companyId || companyOf(req);

    const looks = await db.all(
      `SELECT * FROM looks WHERE company_id = ? ORDER BY display_order ASC, created_at DESC`,
      [companyId]
    );

    res.json({ success: true, looks: await withItems(looks, publicBaseUrl(req)) });
  } catch (error) {
    console.error('Get looks error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch looks' });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, occasion, tagline, wornImage, isActive, displayOrder, items } = req.body;
    const companyId = companyOf(req);

    if (!name || !String(name).trim()) {
      return res.status(400).json({ success: false, error: 'Look name is required' });
    }

    const productIds = normaliseItems(items);
    if (productIds.length === 0) {
      return res.status(400).json({ success: false, error: 'Add at least one piece to the look' });
    }

    const result = await db.run(
      `INSERT INTO looks (company_id, name, occasion, tagline, worn_image, is_active, display_order, created_at, updated_at)
       VALUES (?, ?, ?, ?, NULL, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [
        companyId,
        String(name).trim(),
        occasion || null,
        tagline || null,
        isActive !== false,
        Number(displayOrder) || 0,
      ]
    );

    // The photo itself lives in `look_images` (or, for an external URL, on the
    // row) so the storefront never has to download megabytes of base64.
    await applyWornImage(result.id, wornImage);

    await replaceItems(result.id, productIds);

    const [created] = await withItems(
      [await db.get(`SELECT * FROM looks WHERE id = ?`, [result.id])],
      publicBaseUrl(req)
    );

    res.status(201).json({ success: true, look: created, message: 'Look created' });
  } catch (error) {
    console.error('Create look error:', error);
    res.status(500).json({ success: false, error: 'Failed to create look' });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, occasion, tagline, wornImage, isActive, displayOrder, items } = req.body;
    const companyId = companyOf(req);

    const existing = await db.get(`SELECT * FROM looks WHERE id = ? AND company_id = ?`, [id, companyId]);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Look not found' });
    }

    if (!name || !String(name).trim()) {
      return res.status(400).json({ success: false, error: 'Look name is required' });
    }

    const productIds = normaliseItems(items);
    if (productIds.length === 0) {
      return res.status(400).json({ success: false, error: 'Add at least one piece to the look' });
    }

    // Keep the photo unless the admin actually changed it — an untouched photo
    // comes back as the stored path the API handed out.
    const storedImage = await applyWornImage(id, wornImage);

    await db.run(
      `UPDATE looks
          SET name = ?, occasion = ?, tagline = ?, worn_image = ?,
              is_active = ?, display_order = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND company_id = ?`,
      [
        String(name).trim(),
        occasion || null,
        tagline || null,
        storedImage && storedImage.startsWith('http') ? storedImage : null,
        isActive !== false,
        Number(displayOrder) || 0,
        id,
        companyId,
      ]
    );

    await replaceItems(id, productIds);

    const [updated] = await withItems(
      [await db.get(`SELECT * FROM looks WHERE id = ?`, [id])],
      publicBaseUrl(req)
    );

    res.json({ success: true, look: updated, message: 'Look updated' });
  } catch (error) {
    console.error('Update look error:', error);
    res.status(500).json({ success: false, error: 'Failed to update look' });
  }
});

router.put('/:id/toggle', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = companyOf(req);

    const existing = await db.get(`SELECT * FROM looks WHERE id = ? AND company_id = ?`, [id, companyId]);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Look not found' });
    }

    await db.run(
      `UPDATE looks SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [!(existing.is_active === true || existing.is_active === 1), id]
    );

    res.json({ success: true, isActive: !(existing.is_active === true || existing.is_active === 1) });
  } catch (error) {
    console.error('Toggle look error:', error);
    res.status(500).json({ success: false, error: 'Failed to toggle look' });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = companyOf(req);

    const existing = await db.get(`SELECT * FROM looks WHERE id = ? AND company_id = ?`, [id, companyId]);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Look not found' });
    }

    await db.run(`DELETE FROM look_items WHERE look_id = ?`, [id]);
    await db.run(`DELETE FROM looks WHERE id = ? AND company_id = ?`, [id, companyId]);

    res.json({ success: true, message: 'Look deleted' });
  } catch (error) {
    console.error('Delete look error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete look' });
  }
});

/**
 * The repair is also run at startup, so a freshly deployed backend fixes the
 * legacy rows before the first visitor arrives.
 */
router.backfillWornImages = backfillWornImages;

module.exports = router;