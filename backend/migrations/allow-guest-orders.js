/**
 * Guest orders.
 *
 * Two changes:
 *
 *  1. `orders.user_id` may be empty. An order can now be placed without
 *     an account — the customer gives their name, phone number,
 *     governorate, city and address instead, and the order belongs to
 *     the shop.
 *
 *  2. The delivery fee gets a home in the settings, so the owner can
 *     change it from the admin panel without a deploy. It starts at the
 *     flat fee the shop charges everywhere.
 *
 * Run it with:  node backend/migrations/allow-guest-orders.js
 * It works on both databases — the Postgres one the shop runs on and the
 * SQLite one used for local development.
 */

const path = require('path');

const DELIVERY_FEE = 8;

async function runPostgres() {
  const { Pool } = require('pg');

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('❌ DATABASE_URL not found in environment variables');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  const client = await pool.connect();

  try {
    console.log('🚀 Starting migration on PostgreSQL...');

    await client.query(`
      ALTER TABLE orders
      ALTER COLUMN user_id DROP NOT NULL
    `);
    console.log('✅ orders.user_id can now be empty (guest orders)');

    await client.query(`
      ALTER TABLE orders
      ADD COLUMN IF NOT EXISTS company_id INTEGER
    `);
    console.log('✅ orders.company_id is in place');

    await client.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id SERIAL PRIMARY KEY,
        key TEXT UNIQUE NOT NULL,
        value TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(
      `INSERT INTO settings (key, value) VALUES ($1, $2)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP`,
      ['delivery', JSON.stringify({ fee: DELIVERY_FEE })]
    );
    console.log(`✅ the delivery fee is set to ${DELIVERY_FEE}`);

    console.log('🎉 Migration finished');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

async function runSqlite() {
  const Database = require('better-sqlite3');

  const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'database', 'thrift_shop.db');
  const database = new Database(dbPath);

  try {
    console.log('🚀 Starting migration on SQLite...');

    const columns = database.prepare('PRAGMA table_info(orders)').all();
    if (!columns.length) {
      console.log('ℹ️  There is no orders table yet — nothing to do.');
      return;
    }

    const userId = columns.find((column) => column.name === 'user_id');
    const hasCompanyId = columns.some((column) => column.name === 'company_id');
    const needsRebuild = (userId && userId.notnull === 1) || !hasCompanyId;

    if (needsRebuild) {
      console.log('📦 Rebuilding the orders table…');

      database.pragma('foreign_keys = OFF');

      database.exec(`
        CREATE TABLE orders_migrated (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER,
          status TEXT DEFAULT 'PENDING',
          total REAL NOT NULL,
          subtotal REAL NOT NULL,
          tax REAL NOT NULL,
          shipping REAL NOT NULL,
          payment_method TEXT,
          payment_id TEXT,
          shipping_address TEXT,
          billing_address TEXT,
          company_id INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id)
        )
      `);

      const companyColumn = hasCompanyId ? 'company_id' : 'NULL AS company_id';
      database.exec(`
        INSERT INTO orders_migrated (
          id, user_id, status, total, subtotal, tax, shipping, payment_method,
          payment_id, shipping_address, billing_address, company_id, created_at, updated_at
        )
        SELECT
          id, user_id, status, total, subtotal, tax, shipping, payment_method,
          payment_id, shipping_address, billing_address, ${companyColumn}, created_at, updated_at
        FROM orders
      `);

      database.exec('DROP TABLE orders');
      database.exec('ALTER TABLE orders_migrated RENAME TO orders');

      database.pragma('foreign_keys = ON');
      console.log('✅ orders.user_id can now be empty (guest orders)');
    } else {
      console.log('ℹ️  The orders table is already in the right shape.');
    }

    database.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT UNIQUE NOT NULL,
        value TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    database
      .prepare(
        `INSERT INTO settings (key, value) VALUES (?, ?)
         ON CONFLICT (key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`
      )
      .run('delivery', JSON.stringify({ fee: DELIVERY_FEE }));

    console.log(`✅ the delivery fee is set to ${DELIVERY_FEE}`);
    console.log('🎉 Migration finished');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exitCode = 1;
  } finally {
    database.close();
  }
}

async function run() {
  if (process.env.DATABASE_URL) {
    await runPostgres();
    return;
  }

  console.log('ℹ️  No DATABASE_URL — running against the local SQLite database.');
  await runSqlite();
}

run();
