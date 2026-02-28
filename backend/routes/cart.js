const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

// Get user's cart
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Clean up cart items that are no longer available (out of stock or deleted)
    await db.run(`
      DELETE FROM cart 
      WHERE user_id = ? 
      AND product_id NOT IN (
        SELECT id FROM products WHERE in_stock = TRUE
      )
    `, [req.user.id]);

    const cartItems = await db.all(`
      SELECT 
        c.id as cart_id,
        c.quantity,
        c.created_at as added_at,
        p.*
      FROM cart c
      JOIN products p ON c.product_id = p.id
      WHERE c.user_id = ? AND p.in_stock = TRUE
      ORDER BY c.created_at DESC
    `, [req.user.id]);

    // Parse JSON fields and ensure numeric types
    const formattedItems = cartItems.map(item => ({
      ...item,
      price: parseFloat(item.price) || 0,
      original_price: item.original_price ? parseFloat(item.original_price) : null,
      images: item.images ? JSON.parse(item.images) : [],
      measurements: item.measurements ? JSON.parse(item.measurements) : {},
      care_instructions: item.care_instructions ? JSON.parse(item.care_instructions) : [],
      tags: item.tags ? JSON.parse(item.tags) : []
    }));

    const total = formattedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    res.json({
      items: formattedItems,
      total: total,
      count: formattedItems.length
    });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({ error: 'Failed to get cart' });
  }
});

// Add item to cart
router.post('/add', authenticateToken, async (req, res) => {
  try {
    const { product_id, quantity = 1 } = req.body;
    console.log('Add to cart request:', { user_id: req.user.id, product_id, quantity });

    if (!product_id) {
      console.log('Error: Product ID is required');
      return res.status(400).json({ error: 'Product ID is required' });
    }

    // Check if product exists and is in stock
    const product = await db.get('SELECT * FROM products WHERE id = ? AND in_stock = TRUE', [product_id]);
    console.log('Product found:', product ? `${product.name} (in_stock: ${product.in_stock})` : 'Not found');
    
    if (!product) {
      console.log('Error: Product not found or out of stock');
      return res.status(404).json({ error: 'Product not found or out of stock' });
    }

    // Check if item already exists in cart
    const existingItem = await db.get('SELECT * FROM cart WHERE user_id = ? AND product_id = ?', [req.user.id, product_id]);
    console.log('Existing cart item:', existingItem ? `quantity: ${existingItem.quantity}` : 'Not found');

    if (existingItem) {
      // Item already in cart - don't allow adding again
      console.log('Item already in cart - preventing duplicate');
      return res.status(400).json({ 
        error: 'Item already in cart',
        message: 'This item is already in your cart'
      });
    } else {
      // Add new item
      console.log('Adding new item to cart');
      await db.run(
        'INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)',
        [req.user.id, product_id, quantity]
      );
    }

    console.log('Cart operation successful');
    res.json({ 
      message: 'Item added to cart successfully',
      product: {
        id: product.id,
        name: product.name,
        price: product.price
      }
    });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ error: 'Failed to add item to cart' });
  }
});

// Update cart item quantity
router.put('/update/:cartId', authenticateToken, async (req, res) => {
  try {
    const { cartId } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({ error: 'Valid quantity is required' });
    }

    // Check if cart item belongs to user
    const cartItem = await db.get('SELECT * FROM cart WHERE id = ? AND user_id = ?', [cartId, req.user.id]);
    if (!cartItem) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    await db.run(
      'UPDATE cart SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
      [quantity, cartId, req.user.id]
    );

    res.json({ message: 'Cart updated successfully' });
  } catch (error) {
    console.error('Update cart error:', error);
    res.status(500).json({ error: 'Failed to update cart' });
  }
});

// Remove item from cart
router.delete('/remove/:cartId', authenticateToken, async (req, res) => {
  try {
    const { cartId } = req.params;

    // Check if cart item belongs to user
    const cartItem = await db.get('SELECT * FROM cart WHERE id = ? AND user_id = ?', [cartId, req.user.id]);
    if (!cartItem) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    await db.run('DELETE FROM cart WHERE id = ? AND user_id = ?', [cartId, req.user.id]);

    res.json({ message: 'Item removed from cart successfully' });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({ error: 'Failed to remove item from cart' });
  }
});

// Remove item from cart by product ID
router.delete('/remove-product/:productId', authenticateToken, async (req, res) => {
  try {
    const { productId } = req.params;

    const result = await db.run('DELETE FROM cart WHERE user_id = ? AND product_id = ?', [req.user.id, productId]);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Item not found in cart' });
    }

    res.json({ message: 'Item removed from cart successfully' });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({ error: 'Failed to remove item from cart' });
  }
});

// Clear entire cart
router.delete('/clear', authenticateToken, async (req, res) => {
  try {
    await db.run('DELETE FROM cart WHERE user_id = ?', [req.user.id]);
    res.json({ message: 'Cart cleared successfully' });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({ error: 'Failed to clear cart' });
  }
});

// Get cart count
router.get('/count', authenticateToken, async (req, res) => {
  try {
    const result = await db.get('SELECT COUNT(*) as count FROM cart WHERE user_id = ?', [req.user.id]);
    res.json({ count: result.count || 0 });
  } catch (error) {
    console.error('Get cart count error:', error);
    res.status(500).json({ error: 'Failed to get cart count' });
  }
});

module.exports = router;