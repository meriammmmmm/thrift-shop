const Database = require('better-sqlite3');
const { Pool } = require('pg');
require('dotenv').config();

// Connect to SQLite
const sqlite = new Database('./database/thrift_shop.db');

// Connect to PostgreSQL (use your Railway DATABASE_URL)
const pg = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  console.log('🔄 Starting migration from SQLite to PostgreSQL...');

  try {
    // Migrate users
    console.log('📦 Migrating users...');
    const users = sqlite.prepare('SELECT * FROM users').all();
    for (const user of users) {
      await pg.query(
        `INSERT INTO users (id, email, name, password, role, profile_picture, company_id, admin_company_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (email) DO NOTHING`,
        [user.id, user.email, user.name, user.password, user.role, user.profile_picture, 
         user.company_id, user.admin_company_id, user.created_at, user.updated_at]
      );
    }
    console.log(`✅ Migrated ${users.length} users`);

    // Migrate companies
    console.log('📦 Migrating companies...');
    const companies = sqlite.prepare('SELECT * FROM companies').all();
    for (const company of companies) {
      await pg.query(
        `INSERT INTO companies (id, name, description, logo, website, email, phone, address, city, country, status, commission_rate, show_testimonials, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
         ON CONFLICT (id) DO NOTHING`,
        [company.id, company.name, company.description, company.logo, company.website, 
         company.email, company.phone, company.address, company.city, company.country,
         company.status, company.commission_rate, company.show_testimonials, 
         company.created_at, company.updated_at]
      );
    }
    console.log(`✅ Migrated ${companies.length} companies`);

    // Migrate products
    console.log('📦 Migrating products...');
    const products = sqlite.prepare('SELECT * FROM products').all();
    for (const product of products) {
      await pg.query(
        `INSERT INTO products (id, name, description, price, original_price, images, brand, size, category, condition, color, in_stock, material, measurements, care_instructions, tags, seller_name, seller_rating, seller_location, views, likes, company_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
         ON CONFLICT (id) DO NOTHING`,
        [product.id, product.name, product.description, product.price, product.original_price,
         product.images, product.brand, product.size, product.category, product.condition,
         product.color, product.in_stock, product.material, product.measurements,
         product.care_instructions, product.tags, product.seller_name, product.seller_rating,
         product.seller_location, product.views, product.likes, product.company_id,
         product.created_at, product.updated_at]
      );
    }
    console.log(`✅ Migrated ${products.length} products`);

    // Migrate settings
    console.log('📦 Migrating settings...');
    const settings = sqlite.prepare('SELECT * FROM settings').all();
    for (const setting of settings) {
      await pg.query(
        `INSERT INTO settings (id, key, value, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (key) DO NOTHING`,
        [setting.id, setting.key, setting.value, setting.created_at, setting.updated_at]
      );
    }
    console.log(`✅ Migrated ${settings.length} settings`);

    // Migrate orders
    console.log('📦 Migrating orders...');
    const orders = sqlite.prepare('SELECT * FROM orders').all();
    for (const order of orders) {
      await pg.query(
        `INSERT INTO orders (id, user_id, status, total, subtotal, tax, shipping, payment_method, payment_id, shipping_address, billing_address, company_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
         ON CONFLICT (id) DO NOTHING`,
        [order.id, order.user_id, order.status, order.total, order.subtotal, order.tax,
         order.shipping, order.payment_method, order.payment_id, order.shipping_address,
         order.billing_address, order.company_id, order.created_at, order.updated_at]
      );
    }
    console.log(`✅ Migrated ${orders.length} orders`);

    console.log('🎉 Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration error:', error);
  } finally {
    sqlite.close();
    await pg.end();
  }
}

migrate();
