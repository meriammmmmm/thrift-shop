const express = require('express');
const db = require('../database/db');
const { requireAdmin } = require('../middleware/auth');
const aiService = require('../services/aiService');

const router = express.Router();

// Dashboard analytics
router.get('/dashboard', requireAdmin, async (req, res) => {
  try {
    const adminUser = req.user;
    const companyId = adminUser.admin_company_id;

    if (!companyId) {
      return res.status(403).json({ error: 'Admin not associated with any company' });
    }

    // Get company info
    const company = await db.get('SELECT * FROM companies WHERE id = ?', [companyId]);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Basic stats for this company only
    const [
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenue,
      newUsersThisWeek,
      ordersThisWeek,
      revenueThisWeek
    ] = await Promise.all([
      // Get users who have ordered from this company
      db.get('SELECT COUNT(DISTINCT user_id) as count FROM orders WHERE company_id = ?', [companyId]),
      db.get('SELECT COUNT(*) as count FROM products WHERE company_id = ?', [companyId]),
      db.get('SELECT COUNT(*) as count FROM orders WHERE company_id = ?', [companyId]),
      db.get("SELECT SUM(total) as total FROM orders WHERE company_id = ? AND status != 'CANCELLED'", [companyId]),
      // Get new users who ordered from this company this week
      db.get("SELECT COUNT(DISTINCT o.user_id) as count FROM orders o JOIN users u ON o.user_id = u.id WHERE o.company_id = ? AND u.created_at >= NOW() - INTERVAL '7 days'", [companyId]),
      db.get("SELECT COUNT(*) as count FROM orders WHERE company_id = ? AND created_at >= NOW() - INTERVAL '7 days'", [companyId]),
      db.get("SELECT SUM(total) as total FROM orders WHERE company_id = ? AND created_at >= NOW() - INTERVAL '7 days' AND status != 'CANCELLED'", [companyId])
    ]);

    // Daily sales for the last 30 days (company specific)
    const dailySales = await db.all(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as orders,
        SUM(total) as revenue
      FROM orders 
      WHERE company_id = ? AND created_at >= NOW() - INTERVAL '30 days'
        AND status != 'CANCELLED'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `, [companyId]);

    // Top selling categories (company specific)
    const topCategories = await db.all(`
      SELECT 
        p.category,
        COUNT(oi.id) as sales,
        SUM(oi.price * oi.quantity) as revenue
      FROM products p
      JOIN order_items oi ON p.id = oi.product_id
      JOIN orders o ON oi.order_id = o.id
      WHERE p.company_id = ? AND o.status != 'CANCELLED'
      GROUP BY p.category
      ORDER BY sales DESC
      LIMIT 10
    `, [companyId]);

    // Top selling brands (company specific)
    const topBrands = await db.all(`
      SELECT 
        p.brand,
        COUNT(oi.id) as sales,
        SUM(oi.price * oi.quantity) as revenue
      FROM products p
      JOIN order_items oi ON p.id = oi.product_id
      JOIN orders o ON oi.order_id = o.id
      WHERE p.company_id = ? AND o.status != 'CANCELLED'
      GROUP BY p.brand
      ORDER BY sales DESC
      LIMIT 10
    `, [companyId]);

    // Recent orders (company specific)
    const recentOrders = await db.all(`
      SELECT 
        o.id,
        o.user_id,
        o.status,
        o.total,
        o.subtotal,
        o.tax,
        o.shipping,
        o.payment_method,
        o.payment_id,
        o.shipping_address,
        o.billing_address,
        o.company_id,
        o.created_at,
        o.updated_at,
        u.name as user_name,
        u.email as user_email,
        COUNT(oi.id) as item_count
      FROM orders o
      JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.company_id = ?
      GROUP BY o.id, o.user_id, o.status, o.total, o.subtotal, o.tax, o.shipping, 
               o.payment_method, o.payment_id, o.shipping_address, o.billing_address, 
               o.company_id, o.created_at, o.updated_at, u.name, u.email
      ORDER BY o.created_at DESC
      LIMIT 10
    `, [companyId]);

    // Order status distribution (company specific)
    const orderStatusDistribution = await db.all(`
      SELECT 
        status,
        COUNT(*) as count,
        SUM(total) as total_value
      FROM orders
      WHERE company_id = ?
      GROUP BY status
    `, [companyId]);

    // User registration trend (company-specific customers)
    const userRegistrations = await db.all(`
      SELECT 
        DATE(u.created_at) as date,
        COUNT(DISTINCT u.id) as registrations
      FROM users u
      JOIN orders o ON u.id = o.user_id
      WHERE u.created_at >= NOW() - INTERVAL '30 days'
        AND u.role != 'ADMIN'
        AND o.company_id = ?
      GROUP BY DATE(u.created_at)
      ORDER BY date ASC
    `, [companyId]);

    res.json({
      company,
      stats: {
        totalUsers: totalUsers.count,
        totalProducts: totalProducts.count,
        totalOrders: totalOrders.count,
        totalRevenue: totalRevenue.total || 0,
        newUsersThisWeek: newUsersThisWeek.count,
        ordersThisWeek: ordersThisWeek.count,
        revenueThisWeek: revenueThisWeek.total || 0
      },
      charts: {
        dailySales,
        topCategories,
        topBrands,
        orderStatusDistribution: orderStatusDistribution.map(item => ({
          status: item.status,
          _count: { status: item.count },
          _sum: { total: item.total_value }
        })),
        userRegistrations
      },
      recentOrders: recentOrders.map(order => ({
        ...order,
        user: {
          name: order.user_name,
          email: order.user_email
        },
        orderItems: [{ length: order.item_count }] // Simplified for display
      }))
    });
  } catch (error) {
    console.error('Dashboard data error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all orders (Admin)
router.get('/orders', requireAdmin, async (req, res) => {
  try {
    const adminUser = req.user;
    const companyId = adminUser.admin_company_id;

    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = '';
    let params = [];

    // If admin has a company, filter by that company OR null (for legacy orders)
    // If super admin (no company), show all orders
    if (companyId) {
      whereClause = 'WHERE (o.company_id = ? OR o.company_id IS NULL)';
      params.push(companyId);
    }

    if (status) {
      whereClause += whereClause ? ' AND o.status = ?' : 'WHERE o.status = ?';
      params.push(status);
    }

    const orders = await db.all(`
      SELECT 
        o.id,
        o.user_id,
        o.status,
        o.total,
        o.subtotal,
        o.tax,
        o.shipping,
        o.payment_method,
        o.payment_id,
        o.shipping_address,
        o.billing_address,
        o.company_id,
        o.created_at,
        o.updated_at,
        u.name as user_name,
        u.email as user_email,
        COUNT(oi.id) as item_count
      FROM orders o
      JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      ${whereClause}
      GROUP BY o.id, o.user_id, o.status, o.total, o.subtotal, o.tax, o.shipping,
               o.payment_method, o.payment_id, o.shipping_address, o.billing_address,
               o.company_id, o.created_at, o.updated_at, u.name, u.email
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);

    // Get order items for each order
    const ordersWithItems = [];
    for (const order of orders) {
      try {
        const items = await db.all(`
          SELECT 
            oi.*,
            COALESCE(p.name, CAST(oi.product_id AS TEXT)) as product_name,
            COALESCE(p.images, '[]') as product_images,
            COALESCE(p.description, '') as product_description,
            COALESCE(p.category, '') as product_category,
            COALESCE(p.brand, '') as product_brand
          FROM order_items oi
          LEFT JOIN products p ON oi.product_id = p.id
          WHERE oi.order_id = ?
        `, [order.id]);

        ordersWithItems.push({
          ...order,
          user: {
            name: order.user_name,
            email: order.user_email
          },
          shipping_address: order.shipping_address ? JSON.parse(order.shipping_address) : null,
          billing_address: order.billing_address ? JSON.parse(order.billing_address) : null,
          items: items.map(item => ({
            ...item,
            product_images: item.product_images ? JSON.parse(item.product_images) : [],
            product_name: item.product_name || `Product #${item.product_id}`
          }))
        });
      } catch (itemError) {
        console.error(`Error fetching items for order ${order.id}:`, itemError);
        // Add order without items if there's an error
        ordersWithItems.push({
          ...order,
          user: {
            name: order.user_name,
            email: order.user_email
          },
          shipping_address: order.shipping_address ? JSON.parse(order.shipping_address) : null,
          billing_address: order.billing_address ? JSON.parse(order.billing_address) : null,
          items: []
        });
      }
    }

    const totalResult = await db.get(`
      SELECT COUNT(*) as total FROM orders o ${whereClause}
    `, params);

    res.json({
      orders: ordersWithItems,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalResult.total,
        pages: Math.ceil(totalResult.total / limit)
      }
    });
  } catch (error) {
    console.error('Admin orders fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update order status (Admin)
router.patch('/orders/:id/status', requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const result = await db.run(
      'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, req.params.id]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = await db.get('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    res.json(order);
  } catch (error) {
    console.error('Order status update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all users (Admin)
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const adminUser = req.user;
    const companyId = adminUser.admin_company_id;

    if (!companyId) {
      return res.status(403).json({ error: 'Admin not associated with any company' });
    }

    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    // Get users who belong to this company (registered through their website) OR have ordered from this company
    const users = await db.all(`
      SELECT 
        u.id,
        u.email,
        u.name,
        u.password,
        u.role,
        u.profile_picture,
        u.company_id,
        u.admin_company_id,
        u.created_at,
        u.updated_at,
        ui.phone,
        ui.address,
        ui.city,
        ui.country,
        ui.profile_picture as user_info_profile_picture,
        COUNT(DISTINCT o.id) as order_count,
        SUM(CASE WHEN o.company_id = ? THEN o.total ELSE 0 END) as total_spent
      FROM users u
      LEFT JOIN user_info ui ON u.id = ui.user_id
      LEFT JOIN orders o ON u.id = o.user_id AND o.company_id = ? AND o.status != 'CANCELLED'
      WHERE u.role != 'ADMIN' 
        AND (u.company_id = ? OR EXISTS (
          SELECT 1 FROM orders o2 WHERE o2.user_id = u.id AND o2.company_id = ?
        ))
      GROUP BY u.id, u.email, u.name, u.password, u.role, u.profile_picture, u.company_id, 
               u.admin_company_id, u.created_at, u.updated_at, ui.phone, ui.address, ui.city, 
               ui.country, ui.profile_picture
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?
    `, [companyId, companyId, companyId, companyId, parseInt(limit), offset]);

    const totalResult = await db.get(`
      SELECT COUNT(DISTINCT u.id) as total 
      FROM users u
      WHERE u.role != 'ADMIN' 
        AND (u.company_id = ? OR EXISTS (
          SELECT 1 FROM orders o WHERE o.user_id = u.id AND o.company_id = ?
        ))
    `, [companyId, companyId]);

    res.json({
      users: users.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        created_at: user.created_at,
        profile_picture: user.profile_picture || user.user_info_profile_picture,
        phone: user.phone,
        address: user.address,
        city: user.city,
        country: user.country,
        order_count: user.order_count || 0,
        total_spent: user.total_spent || 0
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalResult.total,
        pages: Math.ceil(totalResult.total / limit)
      }
    });
  } catch (error) {
    console.error('Admin users fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single user with detailed info (Admin)
router.get('/users/:id', requireAdmin, async (req, res) => {
  try {
    const adminUser = req.user;
    const companyId = adminUser.admin_company_id;
    const userId = req.params.id;

    if (!companyId) {
      return res.status(403).json({ error: 'Admin not associated with any company' });
    }

    // Check if this user belongs to this company (registered through their website) OR has ordered from this company
    const userCheck = await db.get(`
      SELECT u.company_id, COUNT(o.id) as order_count 
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id AND o.company_id = ?
      WHERE u.id = ?
      GROUP BY u.id
    `, [companyId, userId]);

    if (!userCheck || (userCheck.company_id !== companyId && userCheck.order_count === 0)) {
      return res.status(403).json({ error: 'User does not belong to your company' });
    }

    // Get user basic info
    const user = await db.get('SELECT * FROM users WHERE id = ?', [userId]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user info (personal details)
    const userInfo = await db.get('SELECT * FROM user_info WHERE user_id = ?', [userId]);

    // Get user orders from this company only
    const orders = await db.all(`
      SELECT 
        o.*,
        COUNT(oi.id) as item_count
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.user_id = ? AND o.company_id = ?
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `, [userId, companyId]);

    // Get user stats (company-specific)
    const stats = await db.get(`
      SELECT 
        COUNT(DISTINCT o.id) as total_orders,
        SUM(o.total) as total_spent,
        COUNT(DISTINCT w.id) as wishlist_items,
        COUNT(DISTINCT c.id) as cart_items
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id AND o.status != 'CANCELLED' AND o.company_id = ?
      LEFT JOIN wishlist w ON u.id = w.user_id
      LEFT JOIN cart c ON u.id = c.user_id
      WHERE u.id = ?
    `, [companyId, userId]);

    // Combine user data with user info for the response
    const combinedUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      created_at: user.created_at,
      updated_at: user.updated_at,
      profile_picture: user.profile_picture || userInfo?.profile_picture,
      order_count: stats.total_orders || 0,
      total_spent: stats.total_spent || 0,
      // Include user info fields directly in user object
      full_name: userInfo?.full_name || null,
      phone: userInfo?.phone || null,
      optional_phone: userInfo?.optional_phone || null,
      address: userInfo?.address || null,
      city: userInfo?.city || null,
      state: userInfo?.state || null,
      zip_code: userInfo?.zip_code || null,
      country: userInfo?.country || null
    };

    res.json({
      user: combinedUser,
      orders,
      stats: {
        total_orders: stats.total_orders || 0,
        total_spent: stats.total_spent || 0,
        wishlist_items: stats.wishlist_items || 0,
        cart_items: stats.cart_items || 0
      }
    });
  } catch (error) {
    console.error('Admin user fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new user (Admin)
router.post('/users', requireAdmin, async (req, res) => {
  try {
    const adminUser = req.user;
    const companyId = adminUser.admin_company_id;

    if (!companyId) {
      return res.status(403).json({ error: 'Admin not associated with any company' });
    }

    const { email, password, name, role = 'USER', userInfo } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check if user exists
    const existingUser = await db.get('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user and link to company
    const result = await db.run(
      'INSERT INTO users (email, password, name, role, company_id) VALUES (?, ?, ?, ?, ?)',
      [email, hashedPassword, name || null, role, companyId]
    );

    // If userInfo is provided, save it
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
        console.error('Error saving user info during admin user creation:', userInfoError);
      }
    }

    // Get created user
    const newUser = await db.get('SELECT id, email, name, role, created_at FROM users WHERE id = ?', [result.id]);

    res.status(201).json({
      message: 'User created successfully',
      user: newUser
    });
  } catch (error) {
    console.error('Admin user creation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user (Admin)
router.put('/users/:id', requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    const { email, name, role, userInfo, ...flatUserInfo } = req.body;

    // Check if user exists
    const existingUser = await db.get('SELECT * FROM users WHERE id = ?', [userId]);
    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if email is already taken by another user
    if (email && email !== existingUser.email) {
      const emailExists = await db.get('SELECT id FROM users WHERE email = ? AND id != ?', [email, userId]);
      if (emailExists) {
        return res.status(400).json({ error: 'Email is already taken by another user' });
      }
    }

    // Update user basic info
    const updateFields = [];
    const updateValues = [];

    if (email) {
      updateFields.push('email = ?');
      updateValues.push(email);
    }
    if (name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(name);
    }
    if (role) {
      updateFields.push('role = ?');
      updateValues.push(role);
    }

    if (updateFields.length > 0) {
      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      updateValues.push(userId);

      await db.run(
        `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );
    }

    // Handle user info - support both nested userInfo object and flat structure
    const userInfoData = userInfo || flatUserInfo;
    
    if (userInfoData && Object.keys(userInfoData).length > 0) {
      const existingUserInfo = await db.get('SELECT * FROM user_info WHERE user_id = ?', [userId]);
      
      if (existingUserInfo) {
        // Update existing user info
        await db.run(
          `UPDATE user_info SET 
            full_name = ?, email = ?, phone = ?, optional_phone = ?,
            address = ?, city = ?, state = ?, zip_code = ?, country = ?,
            profile_picture = ?, updated_at = CURRENT_TIMESTAMP
          WHERE user_id = ?`,
          [
            userInfoData.full_name || userInfoData.fullName || existingUserInfo.full_name,
            userInfoData.email || email || existingUserInfo.email,
            userInfoData.phone || existingUserInfo.phone,
            userInfoData.optional_phone || userInfoData.optionalPhone || existingUserInfo.optional_phone,
            userInfoData.address || existingUserInfo.address,
            userInfoData.city || existingUserInfo.city,
            userInfoData.state || existingUserInfo.state,
            userInfoData.zip_code || userInfoData.zipCode || existingUserInfo.zip_code,
            userInfoData.country || existingUserInfo.country,
            userInfoData.profile_picture || userInfoData.profilePicture || existingUserInfo.profile_picture,
            userId
          ]
        );
      } else {
        // Create new user info
        await db.run(
          `INSERT INTO user_info (
            user_id, full_name, email, phone, optional_phone, 
            address, city, state, zip_code, country, profile_picture
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            userId,
            userInfoData.full_name || userInfoData.fullName || '',
            userInfoData.email || email || '',
            userInfoData.phone || '',
            userInfoData.optional_phone || userInfoData.optionalPhone || '',
            userInfoData.address || '',
            userInfoData.city || '',
            userInfoData.state || '',
            userInfoData.zip_code || userInfoData.zipCode || '',
            userInfoData.country || 'Tunisia',
            userInfoData.profile_picture || userInfoData.profilePicture || null
          ]
        );
      }
    }

    // Get updated user with all info
    const updatedUser = await db.get(`
      SELECT 
        u.*,
        ui.phone,
        ui.address,
        ui.city,
        ui.country,
        ui.profile_picture as user_info_profile_picture,
        ui.full_name,
        ui.optional_phone,
        ui.state,
        ui.zip_code
      FROM users u
      LEFT JOIN user_info ui ON u.id = ui.user_id
      WHERE u.id = ?
    `, [userId]);

    // Format the response to include all fields
    const responseUser = {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.role,
      created_at: updatedUser.created_at,
      updated_at: updatedUser.updated_at,
      profile_picture: updatedUser.profile_picture || updatedUser.user_info_profile_picture,
      phone: updatedUser.phone,
      address: updatedUser.address,
      city: updatedUser.city,
      country: updatedUser.country,
      full_name: updatedUser.full_name,
      optional_phone: updatedUser.optional_phone,
      state: updatedUser.state,
      zip_code: updatedUser.zip_code
    };

    res.json({
      message: 'User updated successfully',
      user: responseUser
    });
  } catch (error) {
    console.error('Admin user update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete user (Admin)
router.delete('/users/:id', requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id;

    // Check if user exists
    const user = await db.get('SELECT * FROM users WHERE id = ?', [userId]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent deleting admin users (safety check)
    if (user.role === 'ADMIN') {
      return res.status(403).json({ error: 'Cannot delete admin users' });
    }

    // Delete related data first (foreign key constraints)
    await db.run('DELETE FROM user_info WHERE user_id = ?', [userId]);
    await db.run('DELETE FROM cart WHERE user_id = ?', [userId]);
    await db.run('DELETE FROM wishlist WHERE user_id = ?', [userId]);
    
    // Note: We might want to keep orders for business records
    // Instead of deleting orders, we could anonymize them
    await db.run('UPDATE orders SET user_id = NULL WHERE user_id = ?', [userId]);

    // Delete the user
    const result = await db.run('DELETE FROM users WHERE id = ?', [userId]);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'User deleted successfully',
      deletedUser: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Admin user deletion error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Debug endpoint to check current admin
router.get('/debug/whoami', requireAdmin, async (req, res) => {
  try {
    const adminUser = req.user;
    const companyId = adminUser.admin_company_id;

    // Get company info
    const company = await db.get('SELECT * FROM companies WHERE id = ?', [companyId]);

    res.json({
      admin: {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        admin_company_id: adminUser.admin_company_id
      },
      company: company || null
    });
  } catch (error) {
    console.error('Debug whoami error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update admin profile
router.put('/profile', requireAdmin, async (req, res) => {
  try {
    const adminUser = req.user;
    const companyId = adminUser.admin_company_id;
    const {
      admin_name,
      admin_email,
      admin_password,
      company_name,
      company_description,
      company_email,
      company_phone,
      company_address,
      company_city,
      company_country,
      company_currency,
      company_logo
    } = req.body;

    if (!companyId) {
      return res.status(403).json({ error: 'Admin not associated with any company' });
    }

    // Update admin user info
    const adminUpdateFields = [];
    const adminUpdateValues = [];

    if (admin_name !== undefined) {
      adminUpdateFields.push('name = ?');
      adminUpdateValues.push(admin_name);
    }
    if (admin_email !== undefined) {
      // Check if email is already taken by another user
      const emailExists = await db.get('SELECT id FROM users WHERE email = ? AND id != ?', [admin_email, adminUser.id]);
      if (emailExists) {
        return res.status(400).json({ error: 'Email is already taken by another user' });
      }
      adminUpdateFields.push('email = ?');
      adminUpdateValues.push(admin_email);
    }
    if (admin_password) {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash(admin_password, 12);
      adminUpdateFields.push('password = ?');
      adminUpdateValues.push(hashedPassword);
    }

    if (adminUpdateFields.length > 0) {
      adminUpdateFields.push('updated_at = CURRENT_TIMESTAMP');
      adminUpdateValues.push(adminUser.id);

      await db.run(
        `UPDATE users SET ${adminUpdateFields.join(', ')} WHERE id = ?`,
        adminUpdateValues
      );
    }

    // Update company info
    const companyUpdateFields = [];
    const companyUpdateValues = [];

    if (company_name !== undefined) {
      companyUpdateFields.push('name = ?');
      companyUpdateValues.push(company_name);
    }
    if (company_description !== undefined) {
      companyUpdateFields.push('description = ?');
      companyUpdateValues.push(company_description);
    }
    if (company_email !== undefined) {
      companyUpdateFields.push('email = ?');
      companyUpdateValues.push(company_email);
    }
    if (company_phone !== undefined) {
      companyUpdateFields.push('phone = ?');
      companyUpdateValues.push(company_phone);
    }
    if (company_address !== undefined) {
      companyUpdateFields.push('address = ?');
      companyUpdateValues.push(company_address);
    }
    if (company_city !== undefined) {
      companyUpdateFields.push('city = ?');
      companyUpdateValues.push(company_city);
    }
    if (company_country !== undefined) {
      companyUpdateFields.push('country = ?');
      companyUpdateValues.push(company_country);
    }
    if (company_currency !== undefined) {
      companyUpdateFields.push('currency = ?');
      companyUpdateValues.push(company_currency);
    }
    if (company_logo !== undefined) {
      companyUpdateFields.push('logo = ?');
      companyUpdateValues.push(company_logo);
    }

    if (companyUpdateFields.length > 0) {
      companyUpdateFields.push('updated_at = CURRENT_TIMESTAMP');
      companyUpdateValues.push(companyId);

      await db.run(
        `UPDATE companies SET ${companyUpdateFields.join(', ')} WHERE id = ?`,
        companyUpdateValues
      );
    }

    // Get updated user and company info
    const updatedUser = await db.get('SELECT id, email, name, role FROM users WHERE id = ?', [adminUser.id]);
    const updatedCompany = await db.get('SELECT * FROM companies WHERE id = ?', [companyId]);

    res.json({
      message: 'Profile updated successfully',
      user: {
        ...updatedUser,
        company: updatedCompany
      }
    });
  } catch (error) {
    console.error('Admin profile update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Image chat (ChatGPT-style: upload image + ask questions, get AI reply)
router.get('/ai/chat-image', requireAdmin, (req, res) => {
  res.json({ ok: true, message: 'Image chat route is registered. Use POST with { image, message } to chat.' });
});
router.post('/ai/chat-image', requireAdmin, async (req, res) => {
  try {
    const { image, message, messages: previousMessages } = req.body;
    if (!image) {
      return res.status(400).json({ error: 'Image is required (base64 data URL)' });
    }
    const result = await aiService.chatAboutImage(image, message || 'What do you see in this image?', previousMessages || []);
    if (result.success) {
      return res.json({ success: true, reply: result.reply, usage: result.usage });
    }
    res.status(400).json({ success: false, error: result.error });
  } catch (error) {
    console.error('Admin image chat error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// AI-powered product description generation
router.post('/ai/generate-description', requireAdmin, async (req, res) => {
  try {
    const { image, productName, category, brand, additionalInfo } = req.body;

    if (!image && !productName) {
      return res.status(400).json({ error: 'Either image or product name is required' });
    }

    let result;
    if (image) {
      // Generate description from image
      result = await aiService.generateProductDescription(image, productName, category, brand);
    } else {
      // Generate description from text only
      result = await aiService.generateProductDescriptionFromText(productName, category, brand, additionalInfo);
    }

    if (result.success) {
      res.json({
        success: true,
        data: result.data
      });
    } else {
      // Return detailed error information for API key issues
      res.status(400).json({
        success: false,
        error: result.error,
        instructions: result.instructions,
        details: result.details
      });
    }
  } catch (error) {
    console.error('AI description generation error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to generate description',
      details: error.message
    });
  }
});

module.exports = router;