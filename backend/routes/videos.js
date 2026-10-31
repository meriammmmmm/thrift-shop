const express = require('express');
const crypto = require('crypto');
const db = require('../database/db');
const { requireAdmin } = require('../middleware/auth');
const {
  decodeDataUri,
  publicBaseUrl,
  firstProductImageUrl,
} = require('../services/imageUrl');

const router = express.Router();

/**
 * Videos for the products of a company.
 *
 * A clip is uploaded from the admin panel and kept as bytes next to the
 * product it belongs to, so the shop can play it straight from the API. The
 * list endpoint never carries the bytes — it hands out links instead, and the
 * clip itself is served from its own route with range support so the browser
 * can seek without downloading the whole file.
 */

/** The biggest clip we accept. Base64 makes it a third bigger on the wire. */
const MAX_VIDEO_BYTES = 25 * 1024 * 1024;
const MAX_POSTER_BYTES = 3 * 1024 * 1024;

const ALLOWED_VIDEO_MIMES = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/ogg',
];

/** A strong ETag for a body, so a repeat request costs a 304 instead of a copy. */
const bodyEtag = (buffer) =>
  `"${crypto.createHash('sha1').update(buffer).digest('hex')}"`;

/** The shape the storefront and the panel both work with. */
function toVideo(row, baseUrl) {
  return {
    id: row.id,
    product_id: row.product_id,
    title: row.title || null,
    mime: row.mime,
    size: row.size,
    is_active: row.is_active === true || row.is_active === 1 || row.is_active === '1',
    display_order: row.display_order ?? 0,
    created_at: row.created_at,
    video_url: `${baseUrl}/videos/${row.id}/stream`,
    poster_url: row.poster_mime ? `${baseUrl}/videos/${row.id}/poster` : null,
    product: {
      id: row.product_id,
      name: row.product_name,
      price: row.price !== null && row.price !== undefined ? parseFloat(row.price) : 0,
      original_price:
        row.original_price !== null && row.original_price !== undefined
          ? parseFloat(row.original_price)
          : null,
      brand: row.brand,
      category: row.category,
      in_stock: row.in_stock === true || row.in_stock === 1,
      visible: row.visible === true || row.visible === 1 || row.visible === null,
      image: firstProductImageUrl(row.product_id, row.images, baseUrl),
    },
  };
}

const VIDEO_SELECT = `
  SELECT v.id, v.product_id, v.title, v.mime, v.size, v.is_active, v.display_order,
         v.created_at, v.poster_mime,
         p.name AS product_name, p.price, p.original_price, p.brand, p.category,
         p.images, p.in_stock, p.visible
  FROM product_videos v
  JOIN products p ON p.id = v.product_id
`;

/**
 * The clips of a company, newest first in the order the panel gave them.
 *
 * The bytes are left out on purpose — the response only carries links.
 */
router.get('/', async (req, res) => {
  try {
    const companyId = parseInt(req.query.companyId || '2', 10);
    if (!companyId || companyId <= 0) {
      return res.status(400).json({ error: 'companyId is required' });
    }

    const baseUrl = publicBaseUrl(req);
    const rows = await db.all(
      `${VIDEO_SELECT}
       WHERE v.company_id = ?
       ORDER BY v.display_order ASC, v.created_at DESC`,
      [companyId]
    );

    res.json({ videos: rows.map((row) => toVideo(row, baseUrl)) });
  } catch (error) {
    console.error('Videos fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Every clip of a company for the admin panel, hidden ones included.
 */
router.get('/admin/list', requireAdmin, async (req, res) => {
  try {
    const companyId = req.user.admin_company_id;
    if (!companyId) {
      return res.status(403).json({ error: 'Admin not associated with any company' });
    }

    const baseUrl = publicBaseUrl(req);
    const rows = await db.all(
      `${VIDEO_SELECT}
       WHERE v.company_id = ?
       ORDER BY v.display_order ASC, v.created_at DESC`,
      [companyId]
    );

    res.json({ videos: rows.map((row) => toVideo(row, baseUrl)) });
  } catch (error) {
    console.error('Admin videos fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Play the clip.
 *
 * Range requests are answered, so the browser can start playing before the
 * whole file has arrived and can seek to any point in it.
 */
router.get('/:id/stream', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const row = await db.get(`SELECT video, mime FROM product_videos WHERE id = ?`, [id]);
    if (!row?.video) {
      return res.status(404).json({ error: 'No video with this id' });
    }

    const buffer = Buffer.isBuffer(row.video)
      ? row.video
      : Buffer.from(String(row.video), 'base64');
    if (!buffer.length) {
      return res.status(404).json({ error: 'No video with this id' });
    }

    const mime = row.mime || 'video/mp4';
    const etag = bodyEtag(buffer);

    res.set({
      'Content-Type': mime,
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=3600',
      ETag: etag,
    });

    if (req.headers['if-none-match'] === etag) {
      return res.status(304).end();
    }

    const range = req.headers.range;
    if (range) {
      const match = /bytes=(\d*)-(\d*)/.exec(range);
      if (match) {
        const start = match[1] ? parseInt(match[1], 10) : 0;
        const end = match[2] ? parseInt(match[2], 10) : buffer.length - 1;

        if (Number.isNaN(start) || Number.isNaN(end) || start > end || start >= buffer.length) {
          res.set('Content-Range', `bytes */${buffer.length}`);
          return res.status(416).end();
        }

        const safeEnd = Math.min(end, buffer.length - 1);
        res.status(206).set({
          'Content-Range': `bytes ${start}-${safeEnd}/${buffer.length}`,
          'Content-Length': safeEnd - start + 1,
        });
        return res.end(buffer.slice(start, safeEnd + 1));
      }
    }

    res.set('Content-Length', buffer.length);
    return res.end(buffer);
  } catch (error) {
    console.error('Video stream error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * The still that stands in for the clip before it is played.
 */
router.get('/:id/poster', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const row = await db.get(`SELECT poster, poster_mime FROM product_videos WHERE id = ?`, [id]);
    if (!row?.poster) {
      return res.status(404).json({ error: 'No poster for this video' });
    }

    const buffer = Buffer.isBuffer(row.poster)
      ? row.poster
      : Buffer.from(String(row.poster), 'base64');
    if (!buffer.length) {
      return res.status(404).json({ error: 'No poster for this video' });
    }

    const etag = bodyEtag(buffer);
    res.set({
      'Content-Type': row.poster_mime || 'image/jpeg',
      'Cache-Control': 'public, max-age=3600',
      ETag: etag,
    });

    if (req.headers['if-none-match'] === etag) {
      return res.status(304).end();
    }

    res.set('Content-Length', buffer.length);
    return res.end(buffer);
  } catch (error) {
    console.error('Video poster error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Attach a clip to a product.
 *
 * The panel sends the file as a data URI, the same way the worn-outfit photo
 * is sent, and the bytes are unpacked here before they are stored.
 */
router.post('/', requireAdmin, async (req, res) => {
  try {
    const companyId = req.user.admin_company_id;
    if (!companyId) {
      return res.status(403).json({ error: 'Admin not associated with any company' });
    }

    const { product_id, title, video, poster } = req.body;
    const productId = parseInt(product_id, 10);

    if (!productId) {
      return res.status(400).json({ error: 'A product is required' });
    }

    const product = await db.get(
      'SELECT id FROM products WHERE id = ? AND company_id = ?',
      [productId, companyId]
    );
    if (!product) {
      return res.status(404).json({ error: 'This product is not in your shop' });
    }

    const clip = decodeDataUri(video);
    if (!clip) {
      return res.status(400).json({ error: 'The video could not be read' });
    }
    if (!ALLOWED_VIDEO_MIMES.includes(clip.mime)) {
      return res.status(400).json({
        error: `Videos have to be MP4, WebM, MOV or OGG (this one is ${clip.mime})`,
      });
    }
    if (clip.buffer.length > MAX_VIDEO_BYTES) {
      return res.status(400).json({
        error: `That video is ${(clip.buffer.length / 1024 / 1024).toFixed(1)} MB. The limit is 25 MB.`,
      });
    }

    let posterBytes = null;
    let posterMime = null;
    if (poster) {
      const still = decodeDataUri(poster);
      if (still) {
        if (still.buffer.length > MAX_POSTER_BYTES) {
          return res.status(400).json({ error: 'That poster is too large (3 MB is the limit)' });
        }
        posterBytes = still.buffer;
        posterMime = still.mime;
      }
    }

    const place = await db.get(
      `SELECT COALESCE(MAX(display_order), -1) + 1 AS next FROM product_videos WHERE company_id = ?`,
      [companyId]
    );

    const result = await db.run(
      `INSERT INTO product_videos
         (company_id, product_id, title, video, mime, size, poster, poster_mime, is_active, display_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        companyId,
        productId,
        title ? String(title).slice(0, 120) : null,
        clip.buffer,
        clip.mime,
        clip.buffer.length,
        posterBytes,
        posterMime,
        true,
        place?.next ?? 0,
      ]
    );

    const row = await db.get(
      `${VIDEO_SELECT} WHERE v.id = ?`,
      [result.id]
    );
    res.status(201).json({ video: toVideo(row, publicBaseUrl(req)) });
  } catch (error) {
    console.error('Video upload error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Put the clips in a new order. The panel sends the whole list.
 *
 * This route is declared before `/:id` on purpose: `/reorder` would
 * otherwise be read as an id.
 */
router.put('/reorder', requireAdmin, async (req, res) => {
  try {
    const companyId = req.user.admin_company_id;
    const { videos } = req.body;

    if (!Array.isArray(videos)) {
      return res.status(400).json({ error: 'videos must be an array' });
    }

    for (let index = 0; index < videos.length; index += 1) {
      const id = parseInt(videos[index]?.id, 10);
      if (!id) continue;
      await db.run(
        `UPDATE product_videos SET display_order = ? WHERE id = ? AND company_id = ?`,
        [index, id, companyId]
      );
    }

    res.json({ message: 'Video order updated successfully', reordered: videos.length });
  } catch (error) {
    console.error('Video reorder error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Rename a clip, move it to another product, hide it, or swap the file.
 */
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const companyId = req.user.admin_company_id;
    const id = parseInt(req.params.id, 10);

    const existing = await db.get(
      'SELECT id FROM product_videos WHERE id = ? AND company_id = ?',
      [id, companyId]
    );
    if (!existing) {
      return res.status(404).json({ error: 'No video with this id' });
    }

    const { title, product_id, is_active, display_order, video, poster } = req.body;

    if (title !== undefined) {
      await db.run(`UPDATE product_videos SET title = ? WHERE id = ?`, [
        title ? String(title).slice(0, 120) : null,
        id,
      ]);
    }

    if (product_id !== undefined) {
      const productId = parseInt(product_id, 10);
      const product = await db.get(
        'SELECT id FROM products WHERE id = ? AND company_id = ?',
        [productId, companyId]
      );
      if (!product) {
        return res.status(404).json({ error: 'This product is not in your shop' });
      }
      await db.run(`UPDATE product_videos SET product_id = ? WHERE id = ?`, [productId, id]);
    }

    if (is_active !== undefined) {
      await db.run(`UPDATE product_videos SET is_active = ? WHERE id = ?`, [
        is_active ? true : false,
        id,
      ]);
    }

    if (display_order !== undefined) {
      await db.run(`UPDATE product_videos SET display_order = ? WHERE id = ?`, [
        parseInt(display_order, 10) || 0,
        id,
      ]);
    }

    if (video) {
      const clip = decodeDataUri(video);
      if (!clip) {
        return res.status(400).json({ error: 'The video could not be read' });
      }
      if (!ALLOWED_VIDEO_MIMES.includes(clip.mime)) {
        return res.status(400).json({
          error: `Videos have to be MP4, WebM, MOV or OGG (this one is ${clip.mime})`,
        });
      }
      if (clip.buffer.length > MAX_VIDEO_BYTES) {
        return res.status(400).json({
          error: `That video is ${(clip.buffer.length / 1024 / 1024).toFixed(1)} MB. The limit is 25 MB.`,
        });
      }
      await db.run(
        `UPDATE product_videos SET video = ?, mime = ?, size = ? WHERE id = ?`,
        [clip.buffer, clip.mime, clip.buffer.length, id]
      );
    }

    if (poster) {
      const still = decodeDataUri(poster);
      if (still && still.buffer.length <= MAX_POSTER_BYTES) {
        await db.run(`UPDATE product_videos SET poster = ?, poster_mime = ? WHERE id = ?`, [
          still.buffer,
          still.mime,
          id,
        ]);
      }
    }

    await db.run(`UPDATE product_videos SET updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [id]);

    const row = await db.get(`${VIDEO_SELECT} WHERE v.id = ?`, [id]);
    res.json({ video: toVideo(row, publicBaseUrl(req)) });
  } catch (error) {
    console.error('Video update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Remove a clip.
 */
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const companyId = req.user.admin_company_id;
    const id = parseInt(req.params.id, 10);

    const result = await db.run(
      'DELETE FROM product_videos WHERE id = ? AND company_id = ?',
      [id, companyId]
    );

    if (!result.changes) {
      return res.status(404).json({ error: 'No video with this id' });
    }

    res.json({ message: 'Video deleted successfully' });
  } catch (error) {
    console.error('Video delete error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
