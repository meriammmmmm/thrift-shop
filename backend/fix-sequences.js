const { Pool } = require('pg');
require('dotenv').config();

const pg = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function fixSequences() {
  console.log('🔧 Fixing PostgreSQL sequences...');
  
  try {
    const tables = ['users', 'products', 'orders', 'order_items', 'companies', 'settings', 'transactions', 'user_info', 'testimonials', 'verification_codes', 'wishlist', 'reviews', 'cart'];
    
    for (const table of tables) {
      try {
        await pg.query(`SELECT setval(pg_get_serial_sequence('${table}', 'id'), COALESCE((SELECT MAX(id) FROM ${table}), 1), true)`);
        console.log(`✅ Fixed sequence for ${table}`);
      } catch (err) {
        console.log(`⚠️  Skipped ${table}: ${err.message}`);
      }
    }
    
    console.log('🎉 All sequences fixed!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pg.end();
  }
}

fixSequences();
