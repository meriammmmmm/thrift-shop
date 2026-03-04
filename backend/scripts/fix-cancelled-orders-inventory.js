const db = require('../database/db');

/**
 * Fix inventory for cancelled/refunded orders
 * This script makes products available again if their orders were cancelled
 */

async function fixCancelledOrdersInventory() {
  try {
    console.log('Starting inventory fix for cancelled orders...\n');

    // Find all cancelled or refunded orders
    const cancelledOrders = await db.all(`
      SELECT id, status, created_at 
      FROM orders 
      WHERE status IN ('CANCELLED', 'REFUNDED')
      ORDER BY created_at DESC
    `);

    console.log(`Found ${cancelledOrders.length} cancelled/refunded orders\n`);

    let fixedCount = 0;

    for (const order of cancelledOrders) {
      console.log(`Processing order #${order.id} (${order.status})...`);

      // Get order items
      const orderItems = await db.all(`
        SELECT oi.product_id, p.name, p.in_stock
        FROM order_items oi
        LEFT JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = ?
      `, [order.id]);

      for (const item of orderItems) {
        if (item.product_id && item.in_stock === 0) {
          // Product exists and is marked as sold - make it available again
          await db.run('UPDATE products SET in_stock = true WHERE id = ?', [item.product_id]);
          console.log(`  ✓ Made product #${item.product_id} (${item.name || 'Unknown'}) available again`);
          fixedCount++;
        } else if (item.product_id && item.in_stock === 1) {
          console.log(`  - Product #${item.product_id} (${item.name || 'Unknown'}) already available`);
        } else if (!item.product_id) {
          console.log(`  - Product was deleted`);
        }
      }
    }

    console.log(`\n✅ Fixed ${fixedCount} products from cancelled orders`);

    // Also check for CONFIRMED orders (not yet paid) that have products marked as sold
    console.log('\n\nChecking CONFIRMED orders (not yet paid)...\n');

    const confirmedOrders = await db.all(`
      SELECT id, status, created_at 
      FROM orders 
      WHERE status = 'CONFIRMED'
      ORDER BY created_at DESC
    `);

    console.log(`Found ${confirmedOrders.length} confirmed orders\n`);

    let confirmedFixedCount = 0;

    for (const order of confirmedOrders) {
      console.log(`Processing order #${order.id} (${order.status})...`);

      const orderItems = await db.all(`
        SELECT oi.product_id, p.name, p.in_stock
        FROM order_items oi
        LEFT JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = ?
      `, [order.id]);

      for (const item of orderItems) {
        if (item.product_id && item.in_stock === 0) {
          // Product is marked as sold but payment not confirmed - make it available
          await db.run('UPDATE products SET in_stock = true WHERE id = ?', [item.product_id]);
          console.log(`  ✓ Made product #${item.product_id} (${item.name || 'Unknown'}) available (payment not confirmed)`);
          confirmedFixedCount++;
        }
      }
    }

    console.log(`\n✅ Fixed ${confirmedFixedCount} products from unconfirmed orders`);
    console.log(`\n🎉 Total fixed: ${fixedCount + confirmedFixedCount} products\n`);

  } catch (error) {
    console.error('Error fixing inventory:', error);
    process.exit(1);
  }
}

// Run the fix
fixCancelledOrdersInventory()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
