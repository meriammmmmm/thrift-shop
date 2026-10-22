const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

/**
 * Styled looks — a photo of the complete outfit being worn plus the individual
 * catalogue products that make it up. Managed entirely from the admin panel and
 * read by the storefront's "Shop the Look" section.
 */

const companyOf = (req) => req.user?.admin_company_id || req.user?.company_id || 1;

const firstImage = (images) => {
  if (Array.isArray(images)) return images[0] || null;
  if (typeof images === 'string') {
    const raw = images.trim();
    if (raw.startsWith('[')) {
      try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed[0] || null : null;
      } catch {
        return null;
      }
    }
    return raw || null;
  }
  return null;
};

/** Attach the look's products (with their first image) to each look row. */
async function withItems(looks) {
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
      image: firstImage(row.images),
    });
  }

  return Array.from(byLook.values());
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

// Active looks for the storefront — no auth required.
router.get('/active', async (req, res) => {
  try {
    const companyId = req.query.companyId || 1;

    const looks = await db.all(
      `SELECT id, name, occasion, tagline, worn_image, display_order, created_at
         FROM looks
        WHERE company_id = ? AND is_active = true
        ORDER BY display_order ASC, created_at DESC`,
      [companyId]
    );

    res.json({ success: true, looks: await withItems(looks) });
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

    res.json({ success: true, looks: await withItems(looks) });
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
       VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [
        companyId,
        String(name).trim(),
        occasion || null,
        tagline || null,
        wornImage || null,
        isActive !== false,
        Number(displayOrder) || 0,
      ]
    );

    await replaceItems(result.id, productIds);

    const [created] = await withItems([await db.get(`SELECT * FROM looks WHERE id = ?`, [result.id])]);

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

    await db.run(
      `UPDATE looks
          SET name = ?, occasion = ?, tagline = ?, worn_image = ?,
              is_active = ?, display_order = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND company_id = ?`,
      [
        String(name).trim(),
        occasion || null,
        tagline || null,
        wornImage || null,
        isActive !== false,
        Number(displayOrder) || 0,
        id,
        companyId,
      ]
    );

    await replaceItems(id, productIds);

    const [updated] = await withItems([await db.get(`SELECT * FROM looks WHERE id = ?`, [id])]);

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

module.exports = router;