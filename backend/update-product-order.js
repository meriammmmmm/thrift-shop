// Script to add display_order column to products table and set initial values
const db = require('./database/db');

async function updateProductOrder() {
  try {
    console.log('🔄 Updating product display order...');
    
    // Get all products grouped by company
    const products = await db.all(`
      SELECT id, company_id 
      FROM products 
      ORDER BY company_id, created_at ASC
    `);
    
    console.log(`📦 Found ${products.length} products`);
    
    // Set display_order for each product based on creation order within company
    let currentCompanyId = null;
    let orderIndex = 0;
    
    for (const product of products) {
      if (product.company_id !== currentCompanyId) {
        currentCompanyId = product.company_id;
        orderIndex = 0;
      }
      
      await db.run(
        'UPDATE products SET display_order = ? WHERE id = ?',
        [orderIndex, product.id]
      );
      
      orderIndex++;
    }
    
    console.log('✅ Product display order updated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating product order:', error);
    process.exit(1);
  }
}

updateProductOrder();
