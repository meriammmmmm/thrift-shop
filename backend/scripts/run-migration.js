const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Get DATABASE_URL from environment or .env file
require('dotenv').config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment variables');
  process.exit(1);
}

async function runMigration() {
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔗 Connecting to database...');
    const client = await pool.connect();
    console.log('✅ Connected to database\n');

    // Read migration file
    const migrationPath = path.join(__dirname, '../migrations/add-reservation-status.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📝 Running migration...\n');
    
    // Split by semicolon and run each statement
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`Executing: ${statement.substring(0, 60)}...`);
        await client.query(statement);
      }
    }

    console.log('\n✅ Migration completed successfully!');
    
    // Verify the changes
    console.log('\n📊 Checking products status...');
    const result = await client.query(`
      SELECT 
        reservation_status,
        COUNT(*) as count
      FROM products
      GROUP BY reservation_status
    `);
    
    console.log('\nProduct status breakdown:');
    result.rows.forEach(row => {
      console.log(`  ${row.reservation_status}: ${row.count} products`);
    });

    client.release();
    await pool.end();
    
    console.log('\n🎉 Done!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    await pool.end();
    process.exit(1);
  }
}

runMigration();
