const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

// Get all articles for a company (Admin list)
router.get('/', async (req, res) => {
  try {
    const companyId = req.query.companyId || 1;

    const articles = await db.all(`
      SELECT * FROM articles
      WHERE company_id = ?
      ORDER BY display_order ASC, created_at DESC
    `, [companyId]);

    res.json({
      success: true,
      articles: articles || []
    });
  } catch (error) {
    console.error('Get articles error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch articles'
    });
  }
});

// Get active articles for frontend
router.get('/active', async (req, res) => {
  try {
    const companyId = req.query.companyId || 1;

    const articles = await db.all(`
      SELECT * FROM articles
      WHERE company_id = ? AND is_active = true
      ORDER BY display_order ASC, created_at DESC
    `, [companyId]);

    res.json({
      success: true,
      articles: articles || []
    });
  } catch (error) {
    console.error('Get active articles error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch active articles'
    });
  }
});

// Get a single article by id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const article = await db.get(`SELECT * FROM articles WHERE id = ?`, [id]);

    if (!article) {
      return res.status(404).json({
        success: false,
        error: 'Article not found'
      });
    }

    res.json({ success: true, article });
  } catch (error) {
    console.error('Get article error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch article'
    });
  }
});

// Create new article (Admin only)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, summary, content, image, author, isActive, displayOrder } = req.body;
    const companyId = req.user.admin_company_id || req.user.company_id || 1;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        error: 'Title and content are required'
      });
    }

    const result = await db.run(`
      INSERT INTO articles (
        company_id, title, summary, content, image, author, is_active, display_order, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [
      companyId,
      title,
      summary || '',
      content,
      image || 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=600&h=400&fit=crop',
      author || 'Admin',
      isActive ? true : false,
      displayOrder || 0
    ]);

    const newArticle = await db.get(`SELECT * FROM articles WHERE id = ?`, [result.id]);

    res.status(201).json({
      success: true,
      article: newArticle,
      message: 'Article created successfully'
    });
  } catch (error) {
    console.error('Create article error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create article'
    });
  }
});

// Update article (Admin only)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, summary, content, image, author, isActive, displayOrder } = req.body;
    const companyId = req.user.admin_company_id || req.user.company_id || 1;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        error: 'Title and content are required'
      });
    }

    const existing = await db.get(`
      SELECT * FROM articles WHERE id = ? AND company_id = ?
    `, [id, companyId]);

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Article not found'
      });
    }

    await db.run(`
      UPDATE articles
      SET title = ?, summary = ?, content = ?, image = ?, author = ?, is_active = ?, display_order = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND company_id = ?
    `, [
      title,
      summary !== undefined ? summary : existing.summary,
      content,
      image || existing.image,
      author || existing.author,
      isActive ? true : false,
      displayOrder !== undefined ? displayOrder : existing.display_order,
      id,
      companyId
    ]);

    const updatedArticle = await db.get(`SELECT * FROM articles WHERE id = ?`, [id]);

    res.json({
      success: true,
      article: updatedArticle,
      message: 'Article updated successfully'
    });
  } catch (error) {
    console.error('Update article error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update article'
    });
  }
});

// Delete article (Admin only)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user.admin_company_id || req.user.company_id || 1;

    const existing = await db.get(`
      SELECT * FROM articles WHERE id = ? AND company_id = ?
    `, [id, companyId]);

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Article not found'
      });
    }

    await db.run(`DELETE FROM articles WHERE id = ? AND company_id = ?`, [id, companyId]);

    res.json({
      success: true,
      message: 'Article deleted successfully'
    });
  } catch (error) {
    console.error('Delete article error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete article'
    });
  }
});

// Toggle article active status (Admin only)
router.patch('/:id/toggle', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user.admin_company_id || req.user.company_id || 1;

    const existing = await db.get(`
      SELECT * FROM articles WHERE id = ? AND company_id = ?
    `, [id, companyId]);

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Article not found'
      });
    }

    const newStatus = existing.is_active ? false : true;

    await db.run(`
      UPDATE articles
      SET is_active = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND company_id = ?
    `, [newStatus, id, companyId]);

    const updatedArticle = await db.get(`SELECT * FROM articles WHERE id = ?`, [id]);

    res.json({
      success: true,
      article: updatedArticle,
      message: 'Article status updated successfully'
    });
  } catch (error) {
    console.error('Toggle article error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to toggle article status'
    });
  }
});

module.exports = router;
