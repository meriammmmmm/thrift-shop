const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

// Get all testimonials for a company
router.get('/', async (req, res) => {
  try {
    const companyId = req.query.companyId || 1;
    
    const testimonials = await db.all(`
      SELECT * FROM testimonials 
      WHERE company_id = ? 
      ORDER BY created_at DESC
    `, [companyId]);

    res.json({
      success: true,
      testimonials: testimonials || []
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
router.get('/active', async (req, res) => {
  try {
    const companyId = req.query.companyId || 1;
    
    const testimonials = await db.all(`
      SELECT * FROM testimonials 
      WHERE company_id = ? AND is_active = 1 
      ORDER BY display_order ASC, created_at DESC
    `, [companyId]);

    res.json({
      success: true,
      testimonials: testimonials || []
    });
  } catch (error) {
    console.error('Get active testimonials error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch active testimonials'
    });
  }
});

// Create new testimonial (Admin only)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, name, description, image, isActive, displayOrder } = req.body;
    const companyId = req.user.admin_company_id || req.user.company_id || 1;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        error: 'Title and description are required'
      });
    }

    const result = await db.run(`
      INSERT INTO testimonials (
        company_id, title, name, description, image, is_active, display_order, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `, [
      companyId,
      title,
      name || title,
      description,
      image || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face',
      isActive ? 1 : 0,
      displayOrder || 0
    ]);

    const newTestimonial = await db.get(`
      SELECT * FROM testimonials WHERE id = ?
    `, [result.id]);

    res.status(201).json({
      success: true,
      testimonial: newTestimonial,
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
    const companyId = req.user.admin_company_id || req.user.company_id || 1;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        error: 'Title and description are required'
      });
    }

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
      UPDATE testimonials 
      SET title = ?, name = ?, description = ?, image = ?, is_active = ?, display_order = ?, updated_at = datetime('now')
      WHERE id = ? AND company_id = ?
    `, [
      title,
      name || title,
      description,
      image || existing.image,
      isActive ? 1 : 0,
      displayOrder || existing.display_order,
      id,
      companyId
    ]);

    const updatedTestimonial = await db.get(`
      SELECT * FROM testimonials WHERE id = ?
    `, [id]);

    res.json({
      success: true,
      testimonial: updatedTestimonial,
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

// Delete testimonial (Admin only)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user.admin_company_id || req.user.company_id || 1;

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
    const companyId = req.user.admin_company_id || req.user.company_id || 1;

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

    const newStatus = existing.is_active ? 0 : 1;

    await db.run(`
      UPDATE testimonials 
      SET is_active = ?, updated_at = datetime('now')
      WHERE id = ? AND company_id = ?
    `, [newStatus, id, companyId]);

    const updatedTestimonial = await db.get(`
      SELECT * FROM testimonials WHERE id = ?
    `, [id]);

    res.json({
      success: true,
      testimonial: updatedTestimonial,
      message: `Testimonial ${newStatus ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    console.error('Toggle testimonial error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to toggle testimonial status'
    });
  }
});

// Update testimonials section visibility (Admin only)
router.patch('/section/visibility', authenticateToken, async (req, res) => {
  try {
    const { showTestimonials } = req.body;
    const companyId = req.user.admin_company_id || req.user.company_id || 1;

    await db.run(`
      UPDATE companies 
      SET show_testimonials = ?, updated_at = datetime('now')
      WHERE id = ?
    `, [showTestimonials ? 1 : 0, companyId]);

    res.json({
      success: true,
      message: `Testimonials section ${showTestimonials ? 'enabled' : 'disabled'} successfully`
    });
  } catch (error) {
    console.error('Update testimonials visibility error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update testimonials visibility'
    });
  }
});

// Customer testimonial submission (Public endpoint)
router.post('/customer-submit', async (req, res) => {
  try {
    const { name, email, title, message, companyId } = req.body;

    if (!name || !message) {
      return res.status(400).json({
        success: false,
        error: 'Name and message are required'
      });
    }

    const result = await db.run(`
      INSERT INTO testimonials (
        company_id, title, name, description, image, is_active, display_order, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `, [
      companyId || 1,
      title || 'Customer Review',
      name,
      message,
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face',
      0, // Inactive by default - admin needs to approve
      999 // Put at end
    ]);

    res.status(201).json({
      success: true,
      message: 'Thank you for your testimonial! We will review it soon.',
      id: result.id
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