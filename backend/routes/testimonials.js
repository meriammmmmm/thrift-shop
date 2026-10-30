const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

/**
 * Placeholder photos that used to be hardcoded as the "default" avatar.
 *
 * Every review used to point at one of these stock photos, so the storefront
 * showed a stranger's face for each customer. They are treated as "no image"
 * now, which makes the client render an initials avatar instead. The rows
 * themselves are left alone — only the value sent to the client changes.
 */
const LEGACY_PLACEHOLDER_AVATARS = [
  'photo-1472099645785-5658abf4ff4e',
  'photo-1438761681033-6461ffad8d80',
  'photo-1494790108755-2616b612b786',
];

/** True when the stored image is one of the old placeholder stock photos. */
function isLegacyPlaceholder(image) {
  if (!image || typeof image !== 'string') return false;
  return LEGACY_PLACEHOLDER_AVATARS.some((id) => image.includes(id));
}

/**
 * The rating, clamped to the 1-5 scale.
 *
 * A review always has a rating: the stars in the form default to 5 and the
 * admin can set them by hand, so a card never shows an empty star row.
 */
function normalizeRating(value) {
  const rating = Number(value);
  if (!Number.isFinite(rating)) return 5;
  return Math.min(5, Math.max(1, Math.round(rating)));
}

/**
 * The review workflow.
 *
 * A customer submits a review from the storefront -> it waits as `pending`
 * -> the admin approves it -> it goes live on the storefront (`approved`) or
 * declines it (`rejected`).
 */
const STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

const SOURCE = {
  CUSTOMER: 'customer',
  ADMIN: 'admin',
};

/**
 * SQLite hands back 0/1, Postgres hands back true/false, and a request body
 * can carry the string "1". Every caller should read the same value, so the
 * flag is normalised in one place instead of at each call site.
 */
function toBool(value, fallback = false) {
  if (value === null || value === undefined || value === '') return fallback;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  const normalized = String(value).trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
  return fallback;
}

/**
 * The status a review should move to. A review that is still waiting for a
 * decision stays pending even when it is edited — only an explicit publish
 * or unpublish changes its state.
 */
function nextStatus(currentStatus, isActive) {
  if (isActive) return STATUS.APPROVED;
  if (currentStatus === STATUS.PENDING) return STATUS.PENDING;
  return STATUS.REJECTED;
}

/**
 * Shape a database row into the payload both apps understand.
 *
 * `likes` and `likedByMe` come from the vote join, so they are passed in
 * rather than read off the row.
 */
function present(row, { likes = 0, likedByMe = false } = {}) {
  if (!row) return null;

  const isActive = toBool(row.is_active, false);

  return {
    ...row,
    // Both spellings are sent so neither app has to know which database is
    // behind the API.
    is_active: isActive,
    isActive,
    status: row.status || (isActive ? STATUS.APPROVED : STATUS.PENDING),
    source: row.source || SOURCE.ADMIN,
    user_id: row.user_id ?? null,
    submitter_email: row.submitter_email ?? null,
    // The old placeholder photos are dropped so the client can draw an
    // initials avatar for a review that has no real photo.
    image: isLegacyPlaceholder(row.image) ? null : row.image,
    rating: normalizeRating(row.rating),
    likes: Number(likes) || 0,
    liked_by_me: Boolean(likedByMe),
  };
}

/**
 * The visitor key that identifies a browser.
 *
 * Likes are counted per visitor so the same person cannot inflate a
 * counter. The key comes from a header the storefront generates once per
 * browser and keeps in localStorage.
 */
function visitorKey(req) {
  const raw = req.get('x-visitor-key');
  if (!raw) return null;
  const key = String(raw).trim().slice(0, 64);
  return key.length >= 8 ? key : null;
}

/**
 * Attach the vote count (and whether this visitor already voted) to a list
 * of review rows.
 *
 * The counts are fetched separately instead of being joined into the main
 * query so the same code works on SQLite and Postgres without the two
 * dialects disagreeing about `?` placeholder ordering.
 */
async function attachVotes(rows, visitor) {
  if (!rows || rows.length === 0) return [];

  const ids = rows.map((row) => row.id);
  const placeholders = ids.map(() => '?').join(', ');

  const counts = await db.all(
    `SELECT testimonial_id, COUNT(*) AS total
     FROM testimonial_likes
     WHERE testimonial_id IN (${placeholders})
     GROUP BY testimonial_id`,
    ids
  );

  const countById = new Map(
    counts.map((row) => [Number(row.testimonial_id), Number(row.total)])
  );

  const likedIds = new Set();
  if (visitor) {
    const mine = await db.all(
      `SELECT testimonial_id FROM testimonial_likes
       WHERE visitor_key = ? AND testimonial_id IN (${placeholders})`,
      [visitor, ...ids]
    );
    mine.forEach((row) => likedIds.add(Number(row.testimonial_id)));
  }

  return rows.map((row) =>
    present(row, {
      likes: countById.get(Number(row.id)) || 0,
      likedByMe: likedIds.has(Number(row.id)),
    })
  );
}

/** The same as `attachVotes`, but for a single row. */
async function attachVotesToOne(row, visitor) {
  if (!row) return null;
  const [presented] = await attachVotes([row], visitor);
  return presented;
}

/**
 * Which company's testimonials to show.
 *
 * A signed-in admin always sees their own company — the storefront may be
 * serving a different company than the default of 1, so the admin list must
 * follow the admin, not the fallback.
 */
function resolveCompanyId(req) {
  if (req.user) {
    const adminCompany = req.user.admin_company_id || req.user.company_id;
    if (adminCompany) return adminCompany;
  }
  return req.query.companyId || 1;
}

/** The company an admin may act on. */
function adminCompanyId(req) {
  return req.user.admin_company_id || req.user.company_id || 1;
}

// Get all testimonials for a company (Admin only)
// The full list includes reviews that are still waiting for approval, so it
// must never be readable without an admin token.
router.get('/', authenticateToken, async (req, res) => {
  try {
    const companyId = resolveCompanyId(req);

    const testimonials = await db.all(`
      SELECT * FROM testimonials 
      WHERE company_id = ? 
      ORDER BY created_at DESC
    `, [companyId]);

    res.json({
      success: true,
      testimonials: await attachVotes(testimonials, visitorKey(req)),
    });
  } catch (error) {
    console.error('Get testimonials error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch testimonials'
    });
  }
});

// Get active testimonials for frontend
// Only reviews the admin approved are published here.
router.get('/active', async (req, res) => {
  try {
    const companyId = req.query.companyId || 1;

    const testimonials = await db.all(`
      SELECT * FROM testimonials 
      WHERE company_id = ? AND is_active = ? AND (status = ? OR status IS NULL)
      ORDER BY display_order ASC, created_at DESC
    `, [companyId, true, STATUS.APPROVED]);

    res.json({
      success: true,
      testimonials: await attachVotes(testimonials, visitorKey(req)),
    });
  } catch (error) {
    console.error('Get active testimonials error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch active testimonials'
    });
  }
});

// Update testimonials section visibility (Admin only)
router.patch('/section/visibility', authenticateToken, async (req, res) => {
  try {
    const { showTestimonials } = req.body;
    const companyId = adminCompanyId(req);

    await db.run(`
      UPDATE companies 
      SET show_testimonials = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [toBool(showTestimonials, true), companyId]);

    res.json({
      success: true,
      message: `Testimonials section ${toBool(showTestimonials, true) ? 'enabled' : 'disabled'} successfully`
    });
  } catch (error) {
    console.error('Update testimonials visibility error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update testimonials visibility'
    });
  }
});

// Create new testimonial (Admin only)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, name, description, image, isActive, displayOrder, rating } = req.body;
    const companyId = adminCompanyId(req);

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        error: 'Title and description are required'
      });
    }

    const active = toBool(isActive, true);

    const result = await db.run(`
      INSERT INTO testimonials (
        company_id, title, name, description, image, is_active, status, source,
        display_order, rating, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [
      companyId,
      title,
      name || title,
      description,
      // No image means the storefront draws an initials avatar for the card.
      image || null,
      active,
      active ? STATUS.APPROVED : STATUS.PENDING,
      SOURCE.ADMIN,
      Number.isFinite(Number(displayOrder)) ? Number(displayOrder) : 0,
      normalizeRating(rating)
    ]);

    const newTestimonial = await db.get(`
      SELECT * FROM testimonials WHERE id = ?
    `, [result.id]);

    res.status(201).json({
      success: true,
      testimonial: await attachVotesToOne(newTestimonial, visitorKey(req)),
      message: 'Testimonial created successfully'
    });
  } catch (error) {
    console.error('Create testimonial error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create testimonial'
    });
  }
});

// Update testimonial (Admin only)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, name, description, image, isActive, displayOrder, rating } = req.body;
    const companyId = adminCompanyId(req);

    // Check if testimonial belongs to user's company
    const existing = await db.get(`
      SELECT * FROM testimonials WHERE id = ? AND company_id = ?
    `, [id, companyId]);

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Testimonial not found'
      });
    }

    if (title !== undefined && !title) {
      return res.status(400).json({
        success: false,
        error: 'Title cannot be empty'
      });
    }

    if (description !== undefined && !description) {
      return res.status(400).json({
        success: false,
        error: 'Description cannot be empty'
      });
    }

    const currentStatus = existing.status || (toBool(existing.is_active, false) ? STATUS.APPROVED : STATUS.PENDING);

    // Only the fields that were actually sent are written, so editing a review
    // never silently unpublishes it.
    const active = isActive === undefined ? toBool(existing.is_active, false) : toBool(isActive, false);
    const status = nextStatus(currentStatus, active);

    await db.run(`
      UPDATE testimonials 
      SET title = ?, name = ?, description = ?, image = ?, is_active = ?, status = ?,
          display_order = ?, rating = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND company_id = ?
    `, [
      title === undefined ? existing.title : title,
      name === undefined ? existing.name : name,
      description === undefined ? existing.description : description,
      // An empty image means "use the initials avatar", so the old value is
      // deliberately cleared rather than kept.
      image === undefined ? existing.image : (image || null),
      active,
      status,
      displayOrder === undefined || displayOrder === null
        ? existing.display_order
        : Number(displayOrder),
      rating === undefined ? normalizeRating(existing.rating) : normalizeRating(rating),
      id,
      companyId
    ]);

    const updatedTestimonial = await db.get(`
      SELECT * FROM testimonials WHERE id = ?
    `, [id]);

    res.json({
      success: true,
      testimonial: await attachVotesToOne(updatedTestimonial, visitorKey(req)),
      message: 'Testimonial updated successfully'
    });
  } catch (error) {
    console.error('Update testimonial error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update testimonial'
    });
  }
});

// Approve a review (Admin only) — publishes it on the storefront
router.patch('/:id/approve', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = adminCompanyId(req);

    const existing = await db.get(`
      SELECT * FROM testimonials WHERE id = ? AND company_id = ?
    `, [id, companyId]);

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Testimonial not found'
      });
    }

    await db.run(`
      UPDATE testimonials 
      SET is_active = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND company_id = ?
    `, [true, STATUS.APPROVED, id, companyId]);

    const updatedTestimonial = await db.get(`
      SELECT * FROM testimonials WHERE id = ?
    `, [id]);

    res.json({
      success: true,
      testimonial: await attachVotesToOne(updatedTestimonial, visitorKey(req)),
      message: 'Review approved and published on the storefront'
    });
  } catch (error) {
    console.error('Approve testimonial error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to approve testimonial'
    });
  }
});

// Reject a review (Admin only) — keeps it off the storefront
router.patch('/:id/reject', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = adminCompanyId(req);

    const existing = await db.get(`
      SELECT * FROM testimonials WHERE id = ? AND company_id = ?
    `, [id, companyId]);

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Testimonial not found'
      });
    }

    await db.run(`
      UPDATE testimonials 
      SET is_active = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND company_id = ?
    `, [false, STATUS.REJECTED, id, companyId]);

    const updatedTestimonial = await db.get(`
      SELECT * FROM testimonials WHERE id = ?
    `, [id]);

    res.json({
      success: true,
      testimonial: await attachVotesToOne(updatedTestimonial, visitorKey(req)),
      message: 'Review rejected'
    });
  } catch (error) {
    console.error('Reject testimonial error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reject testimonial'
    });
  }
});

// Delete testimonial (Admin only)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = adminCompanyId(req);

    // Check if testimonial belongs to user's company
    const existing = await db.get(`
      SELECT * FROM testimonials WHERE id = ? AND company_id = ?
    `, [id, companyId]);

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Testimonial not found'
      });
    }

    // The votes are removed explicitly: SQLite does not enforce
    // ON DELETE CASCADE unless the foreign_keys pragma is on.
    await db.run(`
      DELETE FROM testimonial_likes WHERE testimonial_id = ?
    `, [id]);

    await db.run(`
      DELETE FROM testimonials WHERE id = ? AND company_id = ?
    `, [id, companyId]);

    res.json({
      success: true,
      message: 'Testimonial deleted successfully'
    });
  } catch (error) {
    console.error('Delete testimonial error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete testimonial'
    });
  }
});

// Toggle testimonial active status (Admin only)
router.patch('/:id/toggle', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = adminCompanyId(req);

    // Check if testimonial belongs to user's company
    const existing = await db.get(`
      SELECT * FROM testimonials WHERE id = ? AND company_id = ?
    `, [id, companyId]);

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Testimonial not found'
      });
    }

    const currentlyActive = toBool(existing.is_active, false);
    const newStatus = currentlyActive ? STATUS.REJECTED : STATUS.APPROVED;

    await db.run(`
      UPDATE testimonials 
      SET is_active = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND company_id = ?
    `, [!currentlyActive, newStatus, id, companyId]);

    const updatedTestimonial = await db.get(`
      SELECT * FROM testimonials WHERE id = ?
    `, [id]);

    res.json({
      success: true,
      testimonial: await attachVotesToOne(updatedTestimonial, visitorKey(req)),
      message: `Testimonial ${currentlyActive ? 'unpublished' : 'published'} successfully`
    });
  } catch (error) {
    console.error('Toggle testimonial error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to toggle testimonial status'
    });
  }
});

// Customer testimonial submission (Public endpoint)
// The review is stored as pending: the admin approves it from the admin panel
// before it shows up on the storefront.
router.post('/customer-submit', optionalAuth, async (req, res) => {
  try {
    const { name, email, title, message, companyId, rating } = req.body;

    if (!name || !message) {
      return res.status(400).json({
        success: false,
        error: 'Name and message are required'
      });
    }

    if (String(message).trim().length < 10) {
      return res.status(400).json({
        success: false,
        error: 'Please write at least 10 characters'
      });
    }

    // A signed-in customer gets their review linked to their account, so the
    // admin knows who wrote it and the customer can be traced back to it.
    const submitter = req.user;
    const submitterEmail = submitter?.email || (email ? String(email).trim() : null);

    const result = await db.run(`
      INSERT INTO testimonials (
        company_id, title, name, description, image, is_active, status, source,
        user_id, submitter_email, display_order, rating, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [
      Number(companyId) || 1,
      title || 'Customer Review',
      String(name).trim(),
      String(message).trim(),
      // No photo is stored: the storefront draws an initials avatar from the
      // reviewer's name.
      null,
      false, // Not live until an admin approves it
      STATUS.PENDING,
      SOURCE.CUSTOMER,
      submitter?.id ?? null,
      submitterEmail || null,
      999, // Put at the end of the list
      normalizeRating(rating)
    ]);

    res.status(201).json({
      success: true,
      message: 'Thank you for your review! It will appear once our team approves it.',
      id: result.id,
      status: STATUS.PENDING
    });
  } catch (error) {
    console.error('Customer testimonial submission error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit testimonial'
    });
  }
});

/**
 * Toggle the "this review helped" vote on a live review.
 *
 * The vote is per visitor (the `x-visitor-key` header), so the button can be
 * pressed again to take the vote back. Only reviews that are actually
 * published accept votes — a pending review is not on the storefront yet.
 */
router.post('/:id/like', async (req, res) => {
  try {
    const { id } = req.params;
    const visitor = visitorKey(req);

    if (!visitor) {
      return res.status(400).json({
        success: false,
        error: 'Missing visitor key'
      });
    }

    const existing = await db.get(`
      SELECT id FROM testimonials
      WHERE id = ? AND is_active = ? AND (status = ? OR status IS NULL)
    `, [id, true, STATUS.APPROVED]);

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Review not found'
      });
    }

    const liked = await db.get(`
      SELECT id FROM testimonial_likes
      WHERE testimonial_id = ? AND visitor_key = ?
    `, [id, visitor]);

    let nowLiked;
    if (liked) {
      await db.run(`
        DELETE FROM testimonial_likes WHERE id = ?
      `, [liked.id]);
      nowLiked = false;
    } else {
      await db.run(`
        INSERT INTO testimonial_likes (testimonial_id, visitor_key)
        VALUES (?, ?)
      `, [id, visitor]);
      nowLiked = true;
    }

    const counts = await db.all(`
      SELECT testimonial_id, COUNT(*) AS total
      FROM testimonial_likes
      WHERE testimonial_id IN (?)
      GROUP BY testimonial_id
    `, [id]);

    const total = counts[0] ? Number(counts[0].total) : 0;

    res.json({
      success: true,
      liked: nowLiked,
      likes: total,
    });
  } catch (error) {
    console.error('Toggle testimonial like error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update like'
    });
  }
});

module.exports = router;
