const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

// Get user's wishlist
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const wishlistItems = await db.all(`
      SELECT w.*, p.* 
      FROM wishlist w
      JOIN products p ON w.product_id = p.id
      WHERE w.user_id = ?
      ORDER BY w.created_at DESC
    `, [userId]);

    // Transform the data to match frontend expectations
    const transformedItems = wishlistItems.map(item => ({
      id: item.product_id,
      name: item.name,
      description: item.description,
      price: item.price,
      originalPrice: item.original_price,
      images: item.images ? JSON.parse(item.images) : [],
      brand: item.brand,
      size: item.size,
      category: item.category,
      condition: item.condition,
      color: item.color,
      inStock: item.in_stock === 1,
      material: item.material,
      measurements: item.measurements ? JSON.parse(item.measurements) : {},
      careInstructions: item.care_instructions ? JSON.parse(item.care_instructions) : [],
      tags: item.tags ? JSON.parse(item.tags) : [],
      seller: {
        name: item.seller_name || 'Unknown',
        rating: item.seller_rating || 4.5,
        location: item.seller_location || 'Unknown'
      },
      dateAdded: item.created_at,
      views: item.views || 0,
      likes: item.likes || 0,
      wishlistId: item.id,
      addedToWishlistAt: item.created_at
    }));

    res.json({
      success: true,
      wishlist: transformedItems,
      count: transformedItems.length
    });
  } catch (error) {
    console.error('Get wishlist error:', error);
    res.status(500).json({ error: 'Failed to get wishlist' });
  }
});

// Add item to wishlist
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    // Check if product exists
    const product = await db.get('SELECT * FROM products WHERE id = ?', [productId]);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check if item already in wishlist
    const existingItem = await db.get(
      'SELECT * FROM wishlist WHERE user_id = ? AND product_id = ?',
      [userId, productId]
    );

    if (existingItem) {
      return res.status(400).json({ error: 'Item already in wishlist' });
    }

    // Add to wishlist
    const result = await db.run(
      'INSERT INTO wishlist (user_id, product_id) VALUES (?, ?)',
      [userId, productId]
    );

    res.json({
      success: true,
      message: 'Item added to wishlist',
      wishlistId: result.lastID,
      productId: productId
    });
  } catch (error) {
    console.error('Add to wishlist error:', error);
    res.status(500).json({ error: 'Failed to add item to wishlist' });
  }
});

// Remove item from wishlist
router.delete('/:productId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;

    // Check if item exists in wishlist
    const existingItem = await db.get(
      'SELECT * FROM wishlist WHERE user_id = ? AND product_id = ?',
      [userId, productId]
    );

    if (!existingItem) {
      return res.status(404).json({ error: 'Item not found in wishlist' });
    }

    // Remove from wishlist
    await db.run(
      'DELETE FROM wishlist WHERE user_id = ? AND product_id = ?',
      [userId, productId]
    );

    res.json({
      success: true,
      message: 'Item removed from wishlist',
      productId: parseInt(productId)
    });
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    res.status(500).json({ error: 'Failed to remove item from wishlist' });
  }
});

// Get wishlist item IDs only (for checking if items are wishlisted)
router.get('/ids', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const wishlistIds = await db.all(
      'SELECT product_id FROM wishlist WHERE user_id = ?',
      [userId]
    );

    const ids = wishlistIds.map(item => item.product_id);

    res.json({
      success: true,
      wishlistIds: ids
    });
  } catch (error) {
    console.error('Get wishlist IDs error:', error);
    res.status(500).json({ error: 'Failed to get wishlist IDs' });
  }
});

// Clear entire wishlist
router.delete('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    await db.run('DELETE FROM wishlist WHERE user_id = ?', [userId]);

    res.json({
      success: true,
      message: 'Wishlist cleared'
    });
  } catch (error) {
    console.error('Clear wishlist error:', error);
    res.status(500).json({ error: 'Failed to clear wishlist' });
  }
});

module.exports = router;