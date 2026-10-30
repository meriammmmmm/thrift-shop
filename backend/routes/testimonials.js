const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face';

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

/** Shape a database row into the payload both apps understand. */
function present(row) {
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
  };
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
      testimonials: (testimonials || []).map(present)
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
      testimonials: (testimonials || []).map(present)
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
    const { title, name, description, image, isActive, displayOrder } = req.body;
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
        display_order, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [
      companyId,
      title,
      name || title,
      description,
      image || DEFAULT_AVATAR,
      active,
      active ? STATUS.APPROVED : STATUS.PENDING,
      SOURCE.ADMIN,
      Number.isFinite(Number(displayOrder)) ? Number(displayOrder) : 0
    ]);

    const newTestimonial = await db.get(`
      SELECT * FROM testimonials WHERE id = ?
    `, [result.id]);

    res.status(201).json({
      success: true,
      testimonial: present(newTestimonial),
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
    const { title, name, description, image, isActive, displayOrder } = req.body;
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
          display_order = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND company_id = ?
    `, [
      title === undefined ? existing.title : title,
      name === undefined ? existing.name : name,
      description === undefined ? existing.description : description,
      image === undefined || image === '' ? existing.image : image,
      active,
      status,
      displayOrder === undefined || displayOrder === null
        ? existing.display_order
        : Number(displayOrder),
      id,
      companyId
    ]);

    const updatedTestimonial = await db.get(`
      SELECT * FROM testimonials WHERE id = ?
    `, [id]);

    res.json({
      success: true,
      testimonial: present(updatedTestimonial),
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
      testimonial: present(updatedTestimonial),
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
      testimonial: present(updatedTestimonial),
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
      testimonial: present(updatedTestimonial),
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
    const { name, email, title, message, companyId } = req.body;

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
        user_id, submitter_email, display_order, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [
      Number(companyId) || 1,
      title || 'Customer Review',
      String(name).trim(),
      String(message).trim(),
      DEFAULT_AVATAR,
      false, // Not live until an admin approves it
      STATUS.PENDING,
      SOURCE.CUSTOMER,
      submitter?.id ?? null,
      submitterEmail || null,
      999 // Put at the end of the list
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

module.exports = router;
