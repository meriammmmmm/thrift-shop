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

    // Get order items for each order - ALWAYS show items even if product is sold/deleted
    const ordersWithItems = [];
    for (const order of orders) {
      const items = await db.all(`
        SELECT oi.*, 
               COALESCE(p.name, CAST(oi.product_id AS TEXT)) as product_name, 
               COALESCE(p.images, '[]') as product_images,
               COALESCE(p.description, '') as product_description
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
          product_images: item.product_images ? JSON.parse(item.product_images) : [],
          product_name: item.product_name || `Product #${item.product_id}`
        }))
      });
    }

    res.json({
      orders: ordersWithItems
    });
  } catch (error) {
    console.error('Orders fetch error:', error);
    console.error('Error details:', error.message, error.stack);
    res.status(500).json({ error: 'Internal server error', details: error.message });
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

    // Create order with PROCESSING status (items reserved)
    const orderResult = await db.run(`
      INSERT INTO orders (
        user_id, subtotal, tax, shipping, total, payment_method,
        shipping_address, billing_address, status, company_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PROCESSING', ?)
    `, [
      req.user.id, subtotal, tax, shipping, total, payment_method,
      JSON.stringify(shipping_address), JSON.stringify(billing_address), primaryCompanyId
    ]);

    // Create order items and mark products as RESERVED
    for (const item of orderItems) {
      await db.run(`
        INSERT INTO order_items (order_id, product_id, quantity, price)
        VALUES ($1, $2, $3, $4)
      `, [orderResult.id, item.product_id, item.quantity, item.price]);
      
      // Mark product as RESERVED (processing order)
      await db.run(`
        UPDATE products 
        SET reservation_status = $1, 
            reserved_by_order_id = $2,
            in_stock = $3
        WHERE id = $4
      `, ['reserved', orderResult.id, true, item.product_id]);
    }

    // NOTE: Products are marked as RESERVED when order is PROCESSING
    // They will be marked as SOLD when order is CONFIRMED
    // This allows orders to be cancelled without affecting inventory

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

    // ALWAYS show order items even if product is sold/deleted
    const orderItems = await db.all(`
      SELECT oi.*, 
             COALESCE(p.name, CAST(oi.product_id AS TEXT)) as product_name, 
             COALESCE(p.images, '[]') as product_images,
             COALESCE(p.description, '') as product_description
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
        product_images: item.product_images ? JSON.parse(item.product_images) : [],
        product_name: item.product_name || `Product #${item.product_id}`
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

    const order = await db.get('SELECT * FROM orders WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const oldStatus = order.status;

    // Update order status
    await db.run(
      'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, req.params.id]
    );

    // Handle inventory changes based on status transitions
    const orderItems = await db.all('SELECT product_id FROM order_items WHERE order_id = ?', [req.params.id]);

    // If changing to CANCELLED or REFUNDED, make products available again
    if ((status === 'CANCELLED' || status === 'REFUNDED') && !['CANCELLED', 'REFUNDED'].includes(oldStatus)) {
      for (const item of orderItems) {
        await db.run(`
          UPDATE products 
          SET in_stock = 1, 
              reservation_status = 'available',
              reserved_by_order_id = NULL
          WHERE id = ?
        `, [item.product_id]);
      }
    }

    // If changing to CONFIRMED, SHIPPED, or DELIVERED, mark products as SOLD OUT
    if (['CONFIRMED', 'SHIPPED', 'DELIVERED'].includes(status) && !['CONFIRMED', 'SHIPPED', 'DELIVERED'].includes(oldStatus)) {
      for (const item of orderItems) {
        await db.run(`
          UPDATE products 
          SET in_stock = 0,
              reservation_status = 'sold',
              reserved_by_order_id = NULL
          WHERE id = ?
        `, [item.product_id]);
      }
    }

    // If changing to PROCESSING (and not from a final state), mark as RESERVED
    if (status === 'PROCESSING' && !['CONFIRMED', 'SHIPPED', 'DELIVERED', 'PROCESSING'].includes(oldStatus)) {
      for (const item of orderItems) {
        await db.run(`
          UPDATE products 
          SET in_stock = 1,
              reservation_status = 'reserved',
              reserved_by_order_id = ?
          WHERE id = ?
        `, [req.params.id, item.product_id]);
      }
    }

    const updatedOrder = await db.get('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    res.json(updatedOrder);
  } catch (error) {
    console.error('Order status update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Confirm payment and mark products as sold
router.post('/:id/confirm-payment', authenticateToken, async (req, res) => {
  try {
    const order = await db.get('SELECT * FROM orders WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Get order items and mark products as SOLD OUT
    const orderItems = await db.all('SELECT product_id FROM order_items WHERE order_id = ?', [req.params.id]);
    
    for (const item of orderItems) {
      await db.run(`
        UPDATE products 
        SET in_stock = 0,
            reservation_status = 'sold',
            reserved_by_order_id = NULL
        WHERE id = ?
      `, [item.product_id]);
    }

    // Update order status to CONFIRMED (payment confirmed, items sold)
    await db.run(
      'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      ['CONFIRMED', req.params.id]
    );

    const updatedOrder = await db.get('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    res.json({ message: 'Payment confirmed, products marked as sold', order: updatedOrder });
  } catch (error) {
    console.error('Payment confirmation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Cancel order and make products available again
router.post('/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const order = await db.get('SELECT * FROM orders WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Only allow cancellation if order is not yet delivered
    if (['DELIVERED'].includes(order.status)) {
      return res.status(400).json({ error: 'Cannot cancel order that has been delivered' });
    }

    // Get order items and make products available again
    const orderItems = await db.all('SELECT product_id FROM order_items WHERE order_id = ?', [req.params.id]);
    
    for (const item of orderItems) {
      await db.run(`
        UPDATE products 
        SET in_stock = 1,
            reservation_status = 'available',
            reserved_by_order_id = NULL
        WHERE id = ?
      `, [item.product_id]);
    }

    // Update order status to CANCELLED
    await db.run(
      'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      ['CANCELLED', req.params.id]
    );

    const updatedOrder = await db.get('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    res.json({ message: 'Order cancelled, products are available again', order: updatedOrder });
  } catch (error) {
    console.error('Order cancellation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark order as delivered (for testing/demo)
router.post('/:id/deliver', authenticateToken, async (req, res) => {
  try {
    const order = await db.get('SELECT * FROM orders WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Products should already be SOLD if order was CONFIRMED
    // Just update order status to DELIVERED
    await db.run(
      'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      ['DELIVERED', req.params.id]
    );

    const updatedOrder = await db.get('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    res.json({ message: 'Order marked as delivered', order: updatedOrder });
  } catch (error) {
    console.error('Order delivery update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;