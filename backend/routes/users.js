const express = require('express');
const db = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await db.get(
      'SELECT id, email, name, role, profile_picture, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    res.json(user);
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name, profile_picture } = req.body;
    
    await db.run(
      'UPDATE users SET name = ?, profile_picture = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name, profile_picture || null, req.user.id]
    );

    const user = await db.get(
      'SELECT id, email, name, role, profile_picture, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    res.json(user);
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user wishlist
router.get('/wishlist', authenticateToken, async (req, res) => {
  try {
    const wishlist = await db.all(`
      SELECT p.*, w.created_at as added_at
      FROM wishlist w
      JOIN products p ON w.product_id = p.id
      WHERE w.user_id = ?
      ORDER BY w.created_at DESC
    `, [req.user.id]);

    const parsedWishlist = wishlist.map(item => ({
      ...item,
      images: item.images ? JSON.parse(item.images) : [],
      measurements: item.measurements ? JSON.parse(item.measurements) : null,
      care_instructions: item.care_instructions ? JSON.parse(item.care_instructions) : [],
      tags: item.tags ? JSON.parse(item.tags) : []
    }));

    res.json(parsedWishlist);
  } catch (error) {
    console.error('Wishlist fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add to wishlist
router.post('/wishlist/:productId', authenticateToken, async (req, res) => {
  try {
    const { productId } = req.params;

    // Check if product exists
    const product = await db.get('SELECT id FROM products WHERE id = ?', [productId]);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check if already in wishlist
    const existing = await db.get(
      'SELECT id FROM wishlist WHERE user_id = ? AND product_id = ?',
      [req.user.id, productId]
    );

    if (existing) {
      return res.status(400).json({ error: 'Product already in wishlist' });
    }

    await db.run(
      'INSERT INTO wishlist (user_id, product_id) VALUES (?, ?)',
      [req.user.id, productId]
    );

    res.json({ message: 'Product added to wishlist' });
  } catch (error) {
    console.error('Add to wishlist error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Remove from wishlist
router.delete('/wishlist/:productId', authenticateToken, async (req, res) => {
  try {
    const result = await db.run(
      'DELETE FROM wishlist WHERE user_id = ? AND product_id = ?',
      [req.user.id, req.params.productId]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Product not in wishlist' });
    }

    res.json({ message: 'Product removed from wishlist' });
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add product review
router.post('/reviews', authenticateToken, async (req, res) => {
  try {
    const { product_id, rating, comment } = req.body;

    if (!product_id || !rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Product ID and rating (1-5) are required' });
    }

    // Check if product exists
    const product = await db.get('SELECT id FROM products WHERE id = ?', [product_id]);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check if user already reviewed this product
    const existing = await db.get(
      'SELECT id FROM reviews WHERE user_id = ? AND product_id = ?',
      [req.user.id, product_id]
    );

    if (existing) {
      return res.status(400).json({ error: 'You have already reviewed this product' });
    }

    const result = await db.run(
      'INSERT INTO reviews (user_id, product_id, rating, comment) VALUES (?, ?, ?, ?)',
      [req.user.id, product_id, rating, comment]
    );

    const review = await db.get('SELECT * FROM reviews WHERE id = ?', [result.id]);
    res.status(201).json(review);
  } catch (error) {
    console.error('Review creation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user reviews
router.get('/reviews', authenticateToken, async (req, res) => {
  try {
    const reviews = await db.all(`
      SELECT r.*, p.name as product_name, p.images as product_images
      FROM reviews r
      JOIN products p ON r.product_id = p.id
      WHERE r.user_id = ?
      ORDER BY r.created_at DESC
    `, [req.user.id]);

    const parsedReviews = reviews.map(review => ({
      ...review,
      product_images: review.product_images ? JSON.parse(review.product_images) : []
    }));

    res.json(parsedReviews);
  } catch (error) {
    console.error('Reviews fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user information
router.get('/info', authenticateToken, async (req, res) => {
  try {
    const userInfo = await db.get(
      'SELECT * FROM user_info WHERE user_id = ?',
      [req.user.id]
    );

    if (!userInfo) {
      return res.status(404).json({ error: 'User information not found' });
    }

    // Remove sensitive fields
    const { id, user_id, created_at, updated_at, ...cleanUserInfo } = userInfo;
    
    res.json({
      success: true,
      userInfo: cleanUserInfo
    });
  } catch (error) {
    console.error('User info fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create or update user information
router.post('/info', authenticateToken, async (req, res) => {
  try {
    const {
      fullName,
      email,
      phone,
      optionalPhone,
      address,
      city,
      state,
      zipCode,
      country,
      profile_picture
    } = req.body;

    // Validation
    if (!fullName || !email || !phone || !address || !city || !state || !zipCode) {
      return res.status(400).json({ 
        error: 'Required fields missing',
        required: ['fullName', 'email', 'phone', 'address', 'city', 'state', 'zipCode']
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Phone validation (basic)
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    if (!phoneRegex.test(cleanPhone)) {
      return res.status(400).json({ error: 'Invalid phone number format' });
    }

    // Optional phone validation (if provided)
    if (optionalPhone) {
      const cleanOptionalPhone = optionalPhone.replace(/[\s\-\(\)]/g, '');
      if (!phoneRegex.test(cleanOptionalPhone)) {
        return res.status(400).json({ error: 'Invalid optional phone number format' });
      }
    }

    // Check if user info already exists
    const existingInfo = await db.get(
      'SELECT id FROM user_info WHERE user_id = ?',
      [req.user.id]
    );

    let result;
    if (existingInfo) {
      // Update existing information
      result = await db.run(`
        UPDATE user_info SET 
          full_name = ?, 
          email = ?, 
          phone = ?, 
          optional_phone = ?, 
          address = ?, 
          city = ?, 
          state = ?, 
          zip_code = ?, 
          country = ?,
          profile_picture = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `, [fullName, email, phone, optionalPhone || null, address, city, state, zipCode, country || 'Tunisia', profile_picture || null, req.user.id]);
    } else {
      // Create new information
      result = await db.run(`
        INSERT INTO user_info (
          user_id, full_name, email, phone, optional_phone, 
          address, city, state, zip_code, country, profile_picture
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [req.user.id, fullName, email, phone, optionalPhone || null, address, city, state, zipCode, country || 'Tunisia', profile_picture || null]);
    }

    // Fetch the updated/created information
    const userInfo = await db.get(
      'SELECT * FROM user_info WHERE user_id = ?',
      [req.user.id]
    );

    // Remove sensitive fields
    const { id, user_id, created_at, updated_at, ...cleanUserInfo } = userInfo;

    res.json({
      success: true,
      message: existingInfo ? 'User information updated successfully' : 'User information created successfully',
      userInfo: cleanUserInfo
    });
  } catch (error) {
    console.error('User info save error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user information (PUT method for explicit updates)
router.put('/info', authenticateToken, async (req, res) => {
  try {
    const {
      fullName,
      email,
      phone,
      optionalPhone,
      address,
      city,
      state,
      zipCode,
      country
    } = req.body;

    // Check if user info exists
    const existingInfo = await db.get(
      'SELECT id FROM user_info WHERE user_id = ?',
      [req.user.id]
    );

    if (!existingInfo) {
      return res.status(404).json({ error: 'User information not found. Please create it first.' });
    }

    // Validation
    if (!fullName || !email || !phone || !address || !city || !state || !zipCode) {
      return res.status(400).json({ 
        error: 'Required fields missing',
        required: ['fullName', 'email', 'phone', 'address', 'city', 'state', 'zipCode']
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Phone validation
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    if (!phoneRegex.test(cleanPhone)) {
      return res.status(400).json({ error: 'Invalid phone number format' });
    }

    // Optional phone validation (if provided)
    if (optionalPhone) {
      const cleanOptionalPhone = optionalPhone.replace(/[\s\-\(\)]/g, '');
      if (!phoneRegex.test(cleanOptionalPhone)) {
        return res.status(400).json({ error: 'Invalid optional phone number format' });
      }
    }

    // Update information
    await db.run(`
      UPDATE user_info SET 
        full_name = ?, 
        email = ?, 
        phone = ?, 
        optional_phone = ?, 
        address = ?, 
        city = ?, 
        state = ?, 
        zip_code = ?, 
        country = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `, [fullName, email, phone, optionalPhone || null, address, city, state, zipCode, country || 'Tunisia', req.user.id]);

    // Fetch the updated information
    const userInfo = await db.get(
      'SELECT * FROM user_info WHERE user_id = ?',
      [req.user.id]
    );

    // Remove sensitive fields
    const { id, user_id, created_at, updated_at, ...cleanUserInfo } = userInfo;

    res.json({
      success: true,
      message: 'User information updated successfully',
      userInfo: cleanUserInfo
    });
  } catch (error) {
    console.error('User info update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete user information
router.delete('/info', authenticateToken, async (req, res) => {
  try {
    const result = await db.run(
      'DELETE FROM user_info WHERE user_id = ?',
      [req.user.id]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'User information not found' });
    }

    res.json({
      success: true,
      message: 'User information deleted successfully'
    });
  } catch (error) {
    console.error('User info delete error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;