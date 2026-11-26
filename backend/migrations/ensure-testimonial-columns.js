#!/usr/bin/env node

/**
 * Makes sure the review workflow columns exist on the `testimonials` table.
 *
 * A storefront review is written with the full column list, so a database that
 * is missing one of these columns answers every submission with a 500:
 *
 *   column "review_image" of relation "testimonials" does not exist
 *
 * The columns are added one at a time and each one is checked on its own, so
 * a single statement that Postgres refuses does not take the columns after it
 * down as well.
 *
 * Run it where the database lives:
 *
 *   node backend/migrations/ensure-testimonial-columns.js
 *
 * It reads DATABASE_URL from the environment and falls back to the local
 * SQLite database when there is none.
 */

const path = require('path');

const COLUMNS = [
  { name: 'status', ddl: 'ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS status TEXT' },
  { name: 'source', ddl: 'ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS source TEXT' },
  { name: 'user_id', ddl: 'ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS user_id INTEGER' },
  { name: 'submitter_email', ddl: 'ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS submitter_email TEXT' },
  { name: 'rating', ddl: 'ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS rating INTEGER DEFAULT 5' },
  // The photo a reviewer attached to their review.
  { name: 'review_image', ddl: 'ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS review_image TEXT' },
];

async function runWithPostgres() {
  const { Client } = require('pg');
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('supabase') || process.env.DATABASE_URL.includes('pooler')
      ? { rejectUnauthorized: false }
      : false,
    connectionTimeoutMillis: 15000,
  });

  await client.connect();
  console.log('🐘 Connected to PostgreSQL database');

  let failed = 0;
  for (const column of COLUMNS) {
    try {
      await client.query(column.ddl);
      console.log(`✅ testimonials.${column.name}`);
    } catch (err) {
      failed += 1;
      console.error(`❌ testimonials.${column.name}:`, err.message);
    }
  }

  // Legacy rows: a review that was live is approved, the rest still wait for
  // a decision from the admin.
  try {
    await client.query(`
      UPDATE testimonials
      SET status = CASE WHEN is_active THEN 'approved' ELSE 'pending' END
      WHERE status IS NULL OR status = ''
    `);
    await client.query(`UPDATE testimonials SET source = 'admin' WHERE source IS NULL OR source = ''`);
    await client.query(`UPDATE testimonials SET rating = 5 WHERE rating IS NULL`);
    console.log('✅ backfilled the review workflow columns');
  } catch (err) {
    console.error('⚠️ backfill:', err.message);
  }

  const result = await client.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'testimonials' ORDER BY ordinal_position
  `);
  console.log('testimonials columns now:', result.rows.map((row) => row.column_name).join(', '));

  await client.end();
  return failed;
}

async function runWithSqlite() {
  const Database = require('better-sqlite3');
  const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'database', 'thriftshop.db');
  const db = new Database(dbPath);

  let failed = 0;
  for (const column of COLUMNS) {
    try {
      db.exec(column.ddl);
      console.log(`✅ testimonials.${column.name}`);
    } catch (err) {
      if (!err.message.includes('duplicate column name')) {
        failed += 1;
        console.error(`❌ testimonials.${column.name}:`, err.message);
      }
    }
  }

  const rows = db.prepare('PRAGMA table_info(testimonials)').all();
  console.log('testimonials columns now:', rows.map((row) => row.name).join(', '));
  db.close();
  return failed;
}

(async () => {
  try {
    const failed = process.env.DATABASE_URL
      ? await runWithPostgres()
      : await runWithSqlite();

    if (failed > 0) {
      console.error(`\n❌ ${failed} column(s) could not be added.`);
      process.exit(1);
    }
    console.log('\n✅ The review workflow columns are in place.');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
})();
