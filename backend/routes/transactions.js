const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Get all transactions with filtering and pagination
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      type, 
      status, 
      startDate, 
      endDate,
      userId 
    } = req.query;
    
    const offset = (page - 1) * limit;
    let query = `
      SELECT 
        t.*,
        u.name as username,
        u.email,
        p.name as product_name,
        p.price as product_price
      FROM transactions t
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN products p ON t.product_id = p.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (type) {
      query += ' AND t.type = ?';
      params.push(type);
    }
    
    if (status) {
      query += ' AND t.status = ?';
      params.push(status);
    }
    
    if (userId) {
      query += ' AND t.user_id = ?';
      params.push(userId);
    }
    
    if (startDate) {
      query += ' AND DATE(t.created_at) >= ?';
      params.push(startDate);
    }
    
    if (endDate) {
      query += ' AND DATE(t.created_at) <= ?';
      params.push(endDate);
    }
    
    query += ' ORDER BY t.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const transactions = await db.all(query, params);
    
    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) as total FROM transactions t WHERE 1=1';
    const countParams = [];
    
    if (type) {
      countQuery += ' AND t.type = ?';
      countParams.push(type);
    }
    
    if (status) {
      countQuery += ' AND t.status = ?';
      countParams.push(status);
    }
    
    if (userId) {
      countQuery += ' AND t.user_id = ?';
      countParams.push(userId);
    }
    
    if (startDate) {
      countQuery += ' AND DATE(t.created_at) >= ?';
      countParams.push(startDate);
    }
    
    if (endDate) {
      countQuery += ' AND DATE(t.created_at) <= ?';
      countParams.push(endDate);
    }
    
    const totalResult = await db.get(countQuery, countParams);
    
    res.json({
      transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalResult.total,
        pages: Math.ceil(totalResult.total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// Get transaction by ID
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    const transaction = db.prepare(`
      SELECT 
        t.*,
        u.username,
        u.email,
        p.name as product_name,
        p.price as product_price
      FROM transactions t
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN products p ON t.product_id = p.id
      WHERE t.id = ?
    `).get(id);
    
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    res.json(transaction);
  } catch (error) {
    console.error('Error fetching transaction:', error);
    res.status(500).json({ error: 'Failed to fetch transaction' });
  }
});

// Create new transaction
router.post('/', (req, res) => {
  try {
    const {
      user_id,
      product_id,
      order_id,
      type, // 'purchase', 'refund', 'payment', 'commission'
      amount,
      currency = 'USD',
      status = 'pending', // 'pending', 'completed', 'failed', 'cancelled'
      payment_method,
      description,
      metadata
    } = req.body;
    
    if (!type || !amount) {
      return res.status(400).json({ error: 'Type and amount are required' });
    }
    
    const transaction = db.prepare(`
      INSERT INTO transactions (
        user_id, product_id, order_id, type, amount, currency, 
        status, payment_method, description, metadata, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(
      user_id || null,
      product_id || null,
      order_id || null,
      type,
      amount,
      currency,
      status,
      payment_method || null,
      description || null,
      JSON.stringify(metadata || {})
    );
    
    const newTransaction = db.prepare(`
      SELECT 
        t.*,
        u.username,
        u.email,
        p.name as product_name
      FROM transactions t
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN products p ON t.product_id = p.id
      WHERE t.id = ?
    `).get(transaction.lastInsertRowid);
    
    res.status(201).json(newTransaction);
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ error: 'Failed to create transaction' });
  }
});

// Update transaction status
router.patch('/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }
    
    const validStatuses = ['pending', 'completed', 'failed', 'cancelled', 'refunded'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const result = db.prepare(`
      UPDATE transactions 
      SET status = ?, notes = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(status, notes || null, id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    const updatedTransaction = db.prepare(`
      SELECT 
        t.*,
        u.username,
        u.email,
        p.name as product_name
      FROM transactions t
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN products p ON t.product_id = p.id
      WHERE t.id = ?
    `).get(id);
    
    res.json(updatedTransaction);
  } catch (error) {
    console.error('Error updating transaction:', error);
    res.status(500).json({ error: 'Failed to update transaction' });
  }
});

// Get transaction analytics
router.get('/analytics/summary', (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let dateFilter = '';
    const params = [];
    
    if (startDate && endDate) {
      dateFilter = 'WHERE DATE(created_at) BETWEEN ? AND ?';
      params.push(startDate, endDate);
    } else if (startDate) {
      dateFilter = 'WHERE DATE(created_at) >= ?';
      params.push(startDate);
    } else if (endDate) {
      dateFilter = 'WHERE DATE(created_at) <= ?';
      params.push(endDate);
    }
    
    // Total revenue by type
    const revenueByType = db.prepare(`
      SELECT 
        type,
        COUNT(*) as count,
        SUM(amount) as total_amount,
        AVG(amount) as avg_amount
      FROM transactions 
      ${dateFilter}
      AND status = 'completed'
      GROUP BY type
    `).all(...params);
    
    // Daily revenue trend
    const dailyRevenue = db.prepare(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as transaction_count,
        SUM(amount) as total_amount
      FROM transactions 
      ${dateFilter}
      AND status = 'completed'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT 30
    `).all(...params);
    
    // Status breakdown
    const statusBreakdown = db.prepare(`
      SELECT 
        status,
        COUNT(*) as count,
        SUM(amount) as total_amount
      FROM transactions 
      ${dateFilter}
      GROUP BY status
    `).all(...params);
    
    // Top products by revenue
    const topProducts = db.prepare(`
      SELECT 
        p.name,
        p.id,
        COUNT(t.id) as transaction_count,
        SUM(t.amount) as total_revenue
      FROM transactions t
      JOIN products p ON t.product_id = p.id
      ${dateFilter}
      AND t.status = 'completed'
      AND t.type = 'purchase'
      GROUP BY p.id, p.name
      ORDER BY total_revenue DESC
      LIMIT 10
    `).all(...params);
    
    res.json({
      revenueByType,
      dailyRevenue,
      statusBreakdown,
      topProducts
    });
  } catch (error) {
    console.error('Error fetching transaction analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

module.exports = router;