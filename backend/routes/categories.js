const express = require('express');
const db = require('../database/db');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

console.log('Categories routes loaded!');

// Get all categories for a company
router.get('/', requireAdmin, async (req, res) => {
  try {
    const adminUser = req.user;
    const companyId = adminUser.admin_company_id;

    if (!companyId) {
      return res.status(403).json({ error: 'Admin not associated with any company' });
    }

    const categories = await db.all(`
      SELECT * FROM categories 
      WHERE company_id = ? 
      ORDER BY created_at DESC
    `, [companyId]);

    res.json({ categories });
  } catch (error) {
    console.error('Categories fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new category
router.post('/', requireAdmin, async (req, res) => {
  try {
    const adminUser = req.user;
    const companyId = adminUser.admin_company_id;

    if (!companyId) {
      return res.status(403).json({ error: 'Admin not associated with any company' });
    }

    const { name, description, icon, parent_id } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    // Check if category name already exists for this company
    const existingCategory = await db.get(`
      SELECT id FROM categories 
      WHERE company_id = ? AND LOWER(name) = LOWER(?)
    `, [companyId, name]);

    if (existingCategory) {
      return res.status(400).json({ error: 'Category name already exists' });
    }

    const result = await db.run(`
      INSERT INTO categories (name, description, icon, parent_id, company_id)
      VALUES (?, ?, ?, ?, ?)
    `, [name, description, icon, parent_id, companyId]);

    const category = await db.get('SELECT * FROM categories WHERE id = ?', [result.id]);
    res.status(201).json({ category });
  } catch (error) {
    console.error('Category creation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update a category
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const adminUser = req.user;
    const companyId = adminUser.admin_company_id;

    if (!companyId) {
      return res.status(403).json({ error: 'Admin not associated with any company' });
    }

    const { id } = req.params;
    const { name, description, icon, parent_id } = req.body;

    // Check if category belongs to admin's company
    const existingCategory = await db.get(`
      SELECT company_id FROM categories WHERE id = ?
    `, [id]);

    if (!existingCategory) {
      return res.status(404).json({ error: 'Category not found' });
    }

    if (existingCategory.company_id !== companyId) {
      return res.status(403).json({ error: 'You can only update categories from your company' });
    }

    // Check if new name conflicts with existing categories (excluding current one)
    if (name) {
      const nameConflict = await db.get(`
        SELECT id FROM categories 
        WHERE company_id = ? AND LOWER(name) = LOWER(?) AND id != ?
      `, [companyId, name, id]);

      if (nameConflict) {
        return res.status(400).json({ error: 'Category name already exists' });
      }
    }

    await db.run(`
      UPDATE categories 
      SET name = ?, description = ?, icon = ?, parent_id = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [name, description, icon, parent_id, id]);

    const category = await db.get('SELECT * FROM categories WHERE id = ?', [id]);
    res.json({ category });
  } catch (error) {
    console.error('Category update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a category
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const adminUser = req.user;
    const companyId = adminUser.admin_company_id;

    if (!companyId) {
      return res.status(403).json({ error: 'Admin not associated with any company' });
    }

    const { id } = req.params;

    // Check if category belongs to admin's company
    const existingCategory = await db.get(`
      SELECT company_id FROM categories WHERE id = ?
    `, [id]);

    if (!existingCategory) {
      return res.status(404).json({ error: 'Category not found' });
    }

    if (existingCategory.company_id !== companyId) {
      return res.status(403).json({ error: 'You can only delete categories from your company' });
    }

    // Check if category is being used by products
    const productsUsingCategory = await db.get(`
      SELECT COUNT(*) as count FROM products 
      WHERE category = (SELECT name FROM categories WHERE id = ?) AND company_id = ?
    `, [id, companyId]);

    if (productsUsingCategory.count > 0) {
      return res.status(400).json({ 
        error: `Cannot delete category. ${productsUsingCategory.count} products are using this category.` 
      });
    }

    await db.run('DELETE FROM categories WHERE id = ?', [id]);
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Category deletion error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get categories for frontend (public endpoint for product filtering)
router.get('/public/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;

    const categories = await db.all(`
      SELECT name, description, icon FROM categories 
      WHERE company_id = ? 
      ORDER BY name ASC
    `, [companyId]);

    res.json({ categories });
  } catch (error) {
    console.error('Public categories fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

// Get products for a category
router.get('/:id/products', requireAdmin, async (req, res) => {
  try {
    const adminUser = req.user;
    const companyId = adminUser.admin_company_id;
    const categoryId = req.params.id;

    if (!companyId) {
      return res.status(403).json({ error: 'Admin not associated with any company' });
    }

    // Check if category belongs to admin's company
    const category = await db.get(
      'SELECT * FROM categories WHERE id = ? AND company_id = ?',
      [categoryId, companyId]
    );

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Get all products assigned to this category
    const products = await db.all(`
      SELECT p.* 
      FROM products p
      INNER JOIN category_products cp ON p.id = cp.product_id
      WHERE cp.category_id = ? AND p.company_id = ?
      ORDER BY p.created_at DESC
    `, [categoryId, companyId]);

    res.json({ products });
  } catch (error) {
    console.error('Get category products error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Assign products to a category
router.post('/:id/products', requireAdmin, async (req, res) => {
  try {
    const adminUser = req.user;
    const companyId = adminUser.admin_company_id;
    const categoryId = req.params.id;
    const { productIds } = req.body;

    if (!companyId) {
      return res.status(403).json({ error: 'Admin not associated with any company' });
    }

    if (!Array.isArray(productIds)) {
      return res.status(400).json({ error: 'productIds must be an array' });
    }

    // Check if category belongs to admin's company
    const category = await db.get(
      'SELECT * FROM categories WHERE id = ? AND company_id = ?',
      [categoryId, companyId]
    );

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Remove all existing product assignments for this category
    await db.run('DELETE FROM category_products WHERE category_id = ?', [categoryId]);

    // Add new product assignments
    for (const productId of productIds) {
      // Verify product belongs to the same company
      const product = await db.get(
        'SELECT id FROM products WHERE id = ? AND company_id = ?',
        [productId, companyId]
      );

      if (product) {
        await db.run(
          'INSERT OR IGNORE INTO category_products (category_id, product_id) VALUES (?, ?)',
          [categoryId, productId]
        );
      }
    }

    res.json({
      message: 'Products assigned to category successfully',
      assignedCount: productIds.length
    });
  } catch (error) {
    console.error('Assign products to category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
