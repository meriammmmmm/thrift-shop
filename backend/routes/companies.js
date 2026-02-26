const express = require('express');
const db = require('../database/db');
const { requireAdmin } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

const router = express.Router();

// Public company registration (no auth required)
router.post('/register', async (req, res) => {
  try {
    const {
      name, description, email, phone, address, city, country,
      commission_rate, admin_email, admin_password, admin_name, logo
    } = req.body;

    if (!name || !admin_email || !admin_password) {
      return res.status(400).json({ error: 'Company name, admin email, and password are required' });
    }

    // Check if admin email already exists
    const existingAdmin = await db.get('SELECT id FROM users WHERE email = ?', [admin_email]);
    if (existingAdmin) {
      return res.status(400).json({ error: 'Admin email already exists' });
    }

    // Check if company name already exists
    const existingCompany = await db.get('SELECT id FROM companies WHERE name = ?', [name]);
    if (existingCompany) {
      return res.status(400).json({ error: 'Company name already exists' });
    }

    // Create company with 'active' status so they can login immediately
    const companyResult = await db.run(`
      INSERT INTO companies (name, description, email, phone, address, city, country, commission_rate, logo, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
    `, [
      name, description || '', email || '', phone || '', address || '', 
      city || '', country || '', commission_rate || 0.05, logo || null
    ]);

    // Hash admin password
    const hashedPassword = await bcrypt.hash(admin_password, 12);

    // Create admin user for the company
    const adminResult = await db.run(`
      INSERT INTO users (email, password, name, role, admin_company_id)
      VALUES (?, ?, ?, 'ADMIN', ?)
    `, [admin_email, hashedPassword, admin_name || `${name} Admin`, companyResult.id]);

    // Get created company with admin info
    const company = await db.get(`
      SELECT c.*, u.email as admin_email, u.name as admin_name
      FROM companies c
      LEFT JOIN users u ON c.id = u.admin_company_id AND u.role = 'ADMIN'
      WHERE c.id = ?
    `, [companyResult.id]);

    res.status(201).json({
      message: 'Company registration successful! You can now login to your admin dashboard.',
      company,
      admin: {
        id: adminResult.id,
        email: admin_email,
        name: admin_name || `${name} Admin`
      },
      status: 'active'
    });
  } catch (error) {
    console.error('Company registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all companies (Super Admin only - company admins cannot access this)
router.get('/', requireAdmin, async (req, res) => {
  try {
    const adminUser = req.user;
    
    // Only super admins (not associated with any company) can see all companies
    if (adminUser.admin_company_id) {
      return res.status(403).json({ error: 'Access denied. Super admin privileges required.' });
    }
    
    const companies = await db.all(`
      SELECT c.*, 
             COUNT(DISTINCT u.id) as admin_count,
             COUNT(DISTINCT p.id) as product_count,
             COUNT(DISTINCT o.id) as order_count
      FROM companies c
      LEFT JOIN users u ON c.id = u.admin_company_id AND u.role = 'ADMIN'
      LEFT JOIN products p ON c.id = p.company_id
      LEFT JOIN orders o ON c.id = o.company_id
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `);

    res.json({ companies });
  } catch (error) {
    console.error('Companies fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all active companies (public endpoint for customer interface)
router.get('/public/active', async (req, res) => {
  try {
    const companies = await db.all(`
      SELECT c.id, c.name, c.description, c.logo, c.website, c.email,
             COUNT(DISTINCT p.id) as product_count
      FROM companies c
      LEFT JOIN products p ON c.id = p.company_id AND p.in_stock = 1
      WHERE c.status = 'active'
      GROUP BY c.id
      ORDER BY c.name ASC
    `);

    res.json({ companies });
  } catch (error) {
    console.error('Public companies fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Approve/reject company (Super Admin only)
router.patch('/:id/status', requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const companyId = parseInt(req.params.id);
    
    if (!['active', 'rejected', 'suspended'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be: active, rejected, or suspended' });
    }

    await db.run(
      'UPDATE companies SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, companyId]
    );

    const company = await db.get('SELECT * FROM companies WHERE id = ?', [companyId]);
    
    res.json({ 
      message: `Company ${status} successfully`,
      company 
    });
  } catch (error) {
    console.error('Company status update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new company with admin user
router.post('/', requireAdmin, async (req, res) => {
  try {
    const {
      name, description, email, phone, address, city, country,
      commission_rate, admin_email, admin_password, admin_name, logo
    } = req.body;

    if (!name || !admin_email || !admin_password) {
      return res.status(400).json({ error: 'Company name, admin email, and password are required' });
    }

    // Check if admin email already exists
    const existingAdmin = await db.get('SELECT id FROM users WHERE email = ?', [admin_email]);
    if (existingAdmin) {
      return res.status(400).json({ error: 'Admin email already exists' });
    }

    // Create company
    const companyResult = await db.run(`
      INSERT INTO companies (name, description, email, phone, address, city, country, commission_rate, logo)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      name, description || '', email || '', phone || '', address || '', 
      city || '', country || '', commission_rate || 0.05, logo || null
    ]);

    // Hash admin password
    const hashedPassword = await bcrypt.hash(admin_password, 12);

    // Create admin user for the company
    const adminResult = await db.run(`
      INSERT INTO users (email, password, name, role, admin_company_id)
      VALUES (?, ?, ?, 'ADMIN', ?)
    `, [admin_email, hashedPassword, admin_name || `${name} Admin`, companyResult.id]);

    // Get created company with admin info
    const company = await db.get(`
      SELECT c.*, u.email as admin_email, u.name as admin_name
      FROM companies c
      LEFT JOIN users u ON c.id = u.admin_company_id AND u.role = 'ADMIN'
      WHERE c.id = ?
    `, [companyResult.id]);

    res.status(201).json({
      message: 'Company and admin created successfully',
      company,
      admin: {
        id: adminResult.id,
        email: admin_email,
        name: admin_name || `${name} Admin`
      }
    });
  } catch (error) {
    console.error('Company creation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update company (including logo)
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const adminUser = req.user;
    const companyId = parseInt(req.params.id);
    
    // Check if admin can update this company
    if (adminUser.admin_company_id && adminUser.admin_company_id !== companyId) {
      return res.status(403).json({ error: 'You can only update your own company' });
    }

    const updates = req.body;
    const allowedFields = ['name', 'description', 'email', 'phone', 'address', 'city', 'country', 'commission_rate', 'logo', 'status'];
    
    const updateFields = [];
    const updateValues = [];

    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        updateFields.push(`${key} = ?`);
        updateValues.push(updates[key]);
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateValues.push(companyId);

    await db.run(
      `UPDATE companies SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    const company = await db.get('SELECT * FROM companies WHERE id = ?', [companyId]);
    res.json({ message: 'Company updated successfully', company });
  } catch (error) {
    console.error('Company update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single company
router.get('/:id', requireAdmin, async (req, res) => {
  try {
    const adminUser = req.user;
    const companyId = parseInt(req.params.id);
    
    // Check if admin can view this company
    if (adminUser.admin_company_id && adminUser.admin_company_id !== companyId) {
      return res.status(403).json({ error: 'You can only view your own company' });
    }

    const company = await db.get(`
      SELECT c.*,
             COUNT(DISTINCT u.id) as admin_count,
             COUNT(DISTINCT cu.id) as user_count,
             COUNT(DISTINCT p.id) as product_count,
             COUNT(DISTINCT o.id) as order_count
      FROM companies c
      LEFT JOIN users u ON c.id = u.admin_company_id AND u.role = 'ADMIN'
      LEFT JOIN users cu ON c.id = cu.company_id AND cu.role = 'USER'
      LEFT JOIN products p ON c.id = p.company_id
      LEFT JOIN orders o ON c.id = o.company_id
      WHERE c.id = ?
      GROUP BY c.id
    `, [companyId]);

    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Get company admins
    const admins = await db.all(`
      SELECT id, email, name, created_at
      FROM users 
      WHERE admin_company_id = ? AND role = 'ADMIN'
    `, [companyId]);

    res.json({ company: { ...company, admins } });
  } catch (error) {
    console.error('Company fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete company (Super Admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const companyId = parseInt(req.params.id);
    
    // Get company info before deletion
    const company = await db.get('SELECT * FROM companies WHERE id = ?', [companyId]);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Delete related data (cascade delete)
    await db.run('DELETE FROM users WHERE admin_company_id = ? OR company_id = ?', [companyId, companyId]);
    await db.run('DELETE FROM products WHERE company_id = ?', [companyId]);
    await db.run('DELETE FROM orders WHERE company_id = ?', [companyId]);
    await db.run('DELETE FROM transactions WHERE company_id = ?', [companyId]);
    
    // Delete company
    await db.run('DELETE FROM companies WHERE id = ?', [companyId]);

    res.json({ 
      message: 'Company and all related data deleted successfully',
      deletedCompany: { id: company.id, name: company.name }
    });
  } catch (error) {
    console.error('Company deletion error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;