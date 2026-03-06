// Migration script to add display_order column to products table
const db = require('./database/db');

async function migrate() {
  try {
    console.log('🔄 Starting migration: Adding display_order column...');
    
    // Check if column already exists
    const tableInfo = await db.all("PRAGMA table_info(products)");
    const hasDisplayOrder = tableInfo.some(col => col.name === 'display_order');
    
    if (hasDisplayOrder) {
      console.log('✅ display_order column already exists');
    } else {
      console.log('📝 Adding display_order column...');
      await db.run('ALTER TABLE products ADD COLUMN display_order INTEGER DEFAULT 0');
      console.log('✅ display_order column added successfully');
    }
    
    // Set initial display_order values based on created_at
    console.log('📝 Setting initial display_order values...');
    const products = await db.all('SELECT id FROM products ORDER BY created_at ASC');
    
    for (let i = 0; i < products.length; i++) {
      await db.run('UPDATE products SET display_order = ? WHERE id = ?', [i, products[i].id]);
    }
    
    console.log(`✅ Set display_order for ${products.length} products`);
    console.log('🎉 Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
