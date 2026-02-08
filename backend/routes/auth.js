const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, companyId, userInfo } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check if user exists
    const existingUser = await db.get('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user with company association if provided
    const result = await db.run(
      'INSERT INTO users (email, password, name, company_id) VALUES (?, ?, ?, ?)',
      [email, hashedPassword, name || userInfo?.fullName || null, companyId || null]
    );

    // If userInfo is provided, save it to user_info table
    if (userInfo) {
      try {
        await db.run(
          `INSERT INTO user_info (
            user_id, full_name, email, phone, optional_phone, 
            address, city, state, zip_code, country
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            result.id,
            userInfo.fullName || '',
            userInfo.email || email,
            userInfo.phone || '',
            userInfo.optionalPhone || '',
            userInfo.address || '',
            userInfo.city || '',
            userInfo.state || '',
            userInfo.zipCode || '',
            userInfo.country || 'Tunisia'
          ]
        );
      } catch (userInfoError) {
        console.error('Error saving user info during registration:', userInfoError);
        // Don't fail registration if user info save fails
      }
    }

    // Generate token
    const token = jwt.sign({ userId: result.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    // Get user data
    const user = await db.get('SELECT id, email, name, role, created_at FROM users WHERE id = ?', [result.id]);

    res.status(201).json({
      message: 'User created successfully',
      user,
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if admin's company is approved (if they have a company)
    if (user.role === 'ADMIN' && user.admin_company_id) {
      const company = await db.get('SELECT status FROM companies WHERE id = ?', [user.admin_company_id]);
      
      if (company && company.status === 'pending') {
        return res.status(403).json({ 
          error: 'Your company registration is still pending approval. Please wait for admin approval.',
          status: 'pending'
        });
      }
      
      if (company && company.status === 'rejected') {
        return res.status(403).json({ 
          error: 'Your company registration has been rejected. Please contact support.',
          status: 'rejected'
        });
      }
      
      if (company && company.status === 'suspended') {
        return res.status(403).json({ 
          error: 'Your company account has been suspended. Please contact support.',
          status: 'suspended'
        });
      }
    }

    // Generate token
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    // Get company information for admin users
    let company = null;
    if (user.role === 'ADMIN' && user.admin_company_id) {
      company = await db.get('SELECT * FROM companies WHERE id = ?', [user.admin_company_id]);
    }

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        admin_company_id: user.admin_company_id,
        company_id: user.company_id,
        created_at: user.created_at,
        company: company
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    
    // Get company information for admin users
    let company = null;
    if (user.role === 'ADMIN' && user.admin_company_id) {
      company = await db.get('SELECT * FROM companies WHERE id = ?', [user.admin_company_id]);
    }

    res.json({ 
      user: {
        ...user,
        company: company
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout (client-side token removal)
router.post('/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

module.exports = router;