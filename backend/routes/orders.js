const express = require('express');
const db = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get user orders
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Get orders
    const orders = await db.all(`
      SELECT * FROM orders 
      WHERE user_id = ?
      ORDER BY created_at DESC
    `, [req.user.id]);

    // Get order items for each order
    const ordersWithItems = [];
    for (const order of orders) {
      const items = await db.all(`
        SELECT oi.*, 
               COALESCE(p.name, 'Product no longer available') as product_name, 
               COALESCE(p.images, '[]') as product_images
        FROM order_items oi
        LEFT JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = ?
      `, [order.id]);

      ordersWithItems.push({
        ...order,
        shipping_address: order.shipping_address ? JSON.parse(order.shipping_address) : null,
        billing_address: order.billing_address ? JSON.parse(order.billing_address) : null,
        items: items.map(item => ({
          ...item,
          product_images: item.product_images ? JSON.parse(item.product_images) : []
        }))
      });
    }

    res.json({
      orders: ordersWithItems
    });
  } catch (error) {
    console.error('Orders fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create order
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { items, shipping_address, billing_address, payment_method } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'No items in order' });
    }

    // Calculate totals and group by company
    let subtotal = 0;
    const orderItems = [];
    const companiesInOrder = new Set();

    for (const item of items) {
      const product = await db.get('SELECT * FROM products WHERE id = ?', [item.product_id]);
      
      if (!product) {
        return res.status(400).json({ error: `Product ${item.product_id} is not available` });
      }
      
      // Check if product is already sold
      if (product.in_stock === false || product.in_stock === 0) {
        return res.status(400).json({ error: `Product ${item.product_id} is already sold` });
      }

      const itemTotal = product.price * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        product_id: item.product_id,
        quantity: item.quantity,
        price: product.price,
        company_id: product.company_id
      });

      if (product.company_id) {
        companiesInOrder.add(product.company_id);
      }
    }

    const tax = subtotal * 0.08; // 8% tax
    const shipping = subtotal > 50 ? 0 : 9.99; // Free shipping over $50
    const total = subtotal + tax + shipping;

    // For multi-company orders, we'll create separate orders per company
    // For now, we'll use the first company or null if mixed
    const primaryCompanyId = companiesInOrder.size === 1 ? Array.from(companiesInOrder)[0] : null;

    // Create order
    const orderResult = await db.run(`
      INSERT INTO orders (
        user_id, subtotal, tax, shipping, total, payment_method,
        shipping_address, billing_address, status, company_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'CONFIRMED', ?)
    `, [
      req.user.id, subtotal, tax, shipping, total, payment_method,
      JSON.stringify(shipping_address), JSON.stringify(billing_address), primaryCompanyId
    ]);

    // Create order items
    for (const item of orderItems) {
      await db.run(`
        INSERT INTO order_items (order_id, product_id, quantity, price)
        VALUES (?, ?, ?, ?)
      `, [orderResult.id, item.product_id, item.quantity, item.price]);
    }

    // Update product stock (mark as sold for thrift items)
    for (const item of items) {
      await db.run('UPDATE products SET in_stock = false WHERE id = ?', [item.product_id]);
    }

    // Get complete order
    const order = await db.get('SELECT * FROM orders WHERE id = ?', [orderResult.id]);
    const orderItemsData = await db.all(`
      SELECT oi.*, p.name as product_name, p.images as product_images
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `, [orderResult.id]);

    res.status(201).json({
      order: {
        ...order,
        shipping_address: JSON.parse(order.shipping_address),
        billing_address: JSON.parse(order.billing_address),
        items: orderItemsData.map(item => ({
          ...item,
          product_images: item.product_images ? JSON.parse(item.product_images) : []
        }))
      }
    });
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single order
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const order = await db.get('SELECT * FROM orders WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const orderItems = await db.all(`
      SELECT oi.*, 
             COALESCE(p.name, 'Product no longer available') as product_name, 
             COALESCE(p.images, '[]') as product_images
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `, [req.params.id]);

    res.json({
      ...order,
      shipping_address: JSON.parse(order.shipping_address),
      billing_address: JSON.parse(order.billing_address),
      items: orderItems.map(item => ({
        ...item,
        product_images: item.product_images ? JSON.parse(item.product_images) : []
      }))
    });
  } catch (error) {
    console.error('Order fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update order status (for payment processing, etc.)
router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const result = await db.run(
      'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
      [status, req.params.id, req.user.id]
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

module.exports = router;