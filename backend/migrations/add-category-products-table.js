// Migration script to add category_products table and missing columns
// Run this with: node backend/migrations/add-category-products-table.js

const { Pool } = require('pg');

async function runMigration() {
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error('❌ DATABASE_URL not found in environment variables');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  const client = await pool.connect();

  try {
    console.log('🚀 Starting migration...');

    // Create category_products table
    console.log('📦 Creating category_products table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS category_products (
        id SERIAL PRIMARY KEY,
        category_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        UNIQUE(category_id, product_id)
      )
    `);
    console.log('✅ category_products table created');

    // Add missing columns to products table
    console.log('📦 Adding missing columns to products table...');
    
    try {
      await client.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0`);
      console.log('✅ Added display_order column');
    } catch (err) {
      console.log('⚠️ display_order column might already exist:', err.message);
    }

    try {
      await client.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS reservation_status TEXT DEFAULT 'available'`);
      console.log('✅ Added reservation_status column');
    } catch (err) {
      console.log('⚠️ reservation_status column might already exist:', err.message);
    }

    try {
      await client.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS reserved_by_order_id INTEGER`);
      console.log('✅ Added reserved_by_order_id column');
    } catch (err) {
      console.log('⚠️ reserved_by_order_id column might already exist:', err.message);
    }

    try {
      await client.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS visible BOOLEAN DEFAULT true`);
      console.log('✅ Added visible column');
    } catch (err) {
      console.log('⚠️ visible column might already exist:', err.message);
    }

    // Verify tables
    console.log('\n📊 Verifying tables...');
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('Available tables:');
    tables.rows.forEach(row => console.log(`  - ${row.table_name}`));

    // Check category_products table structure
    const categoryProductsColumns = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'category_products'
      ORDER BY ordinal_position
    `);
    
    if (categoryProductsColumns.rows.length > 0) {
      console.log('\n✅ category_products table structure:');
      categoryProductsColumns.rows.forEach(row => {
        console.log(`  - ${row.column_name}: ${row.data_type}`);
      });
    }

    console.log('\n✅ Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
