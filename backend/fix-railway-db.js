// Quick fix for Railway database
// Run this with: node fix-railway-db.js

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function fix() {
  try {
    console.log('Connecting...');
    
    // Add columns
    await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS reservation_status TEXT DEFAULT 'available'`);
    await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS reserved_by_order_id INTEGER`);
    console.log('✅ Columns added');
    
    // Fix cancelled orders
    const result1 = await pool.query(`
      UPDATE products 
      SET in_stock = true, reservation_status = 'available', reserved_by_order_id = NULL
      WHERE id IN (
        SELECT DISTINCT oi.product_id
        FROM orders o
        JOIN order_items oi ON o.id = oi.order_id
        WHERE o.status IN ('CANCELLED', 'REFUNDED')
      )
    `);
    console.log(`✅ Fixed ${result1.rowCount} products from cancelled orders`);
    
    // Fix confirmed orders
    const result2 = await pool.query(`
      UPDATE products 
      SET in_stock = true, reservation_status = 'available', reserved_by_order_id = NULL
      WHERE id IN (
        SELECT DISTINCT oi.product_id
        FROM orders o
        JOIN order_items oi ON o.id = oi.order_id
        WHERE o.status IN ('CONFIRMED', 'PENDING', 'PROCESSING', 'SHIPPED')
      )
    `);
    console.log(`✅ Fixed ${result2.rowCount} products from undelivered orders`);
    
    // Check status
    const status = await pool.query(`
      SELECT reservation_status, COUNT(*) as count
      FROM products
      GROUP BY reservation_status
    `);
    console.log('\nProduct status:');
    status.rows.forEach(r => console.log(`  ${r.reservation_status}: ${r.count}`));
    
    await pool.end();
    console.log('\n🎉 Done!');
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

fix();
