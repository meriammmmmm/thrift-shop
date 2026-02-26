const { Pool } = require('pg');
const seedDatabase = require('./seed-data');

class PostgresDatabase {
  constructor() {
    const connectionString = process.env.DATABASE_URL;
    
    if (!connectionString) {
      throw new Error('DATABASE_URL not found');
    }

    this.pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false }
    });

    console.log('🐘 Connected to PostgreSQL database');
    this.initTables();
  }

  async initTables() {
    const client = await this.pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          name TEXT,
          password TEXT NOT NULL,
          role TEXT DEFAULT 'USER',
          profile_picture TEXT,
          company_id INTEGER,
          admin_company_id INTEGER,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS products (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          price DECIMAL(10,2) NOT NULL,
          original_price DECIMAL(10,2),
          images TEXT,
          brand TEXT,
          size TEXT,
          category TEXT,
          condition TEXT,
          color TEXT,
          in_stock BOOLEAN DEFAULT true,
          material TEXT,
          measurements TEXT,
          care_instructions TEXT,
          tags TEXT,
          seller_name TEXT,
          seller_rating DECIMAL(3,2),
          seller_location TEXT,
          views INTEGER DEFAULT 0,
          likes INTEGER DEFAULT 0,
          company_id INTEGER,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS orders (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL,
          status TEXT DEFAULT 'PENDING',
          total DECIMAL(10,2) NOT NULL,
          subtotal DECIMAL(10,2) NOT NULL,
          tax DECIMAL(10,2) NOT NULL,
          shipping DECIMAL(10,2) NOT NULL,
          payment_method TEXT,
          payment_id TEXT,
          shipping_address TEXT,
          billing_address TEXT,
          company_id INTEGER,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id)
        )
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS order_items (
          id SERIAL PRIMARY KEY,
          order_id INTEGER NOT NULL,
          product_id INTEGER NOT NULL,
          quantity INTEGER NOT NULL,
          price DECIMAL(10,2) NOT NULL,
          FOREIGN KEY (order_id) REFERENCES orders (id),
          FOREIGN KEY (product_id) REFERENCES products (id)
        )
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS wishlist (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL,
          product_id INTEGER NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id),
          FOREIGN KEY (product_id) REFERENCES products (id),
          UNIQUE(user_id, product_id)
        )
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS reviews (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL,
          product_id INTEGER NOT NULL,
          rating INTEGER NOT NULL,
          comment TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id),
          FOREIGN KEY (product_id) REFERENCES products (id)
        )
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS cart (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL,
          product_id INTEGER NOT NULL,
          quantity INTEGER DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id),
          FOREIGN KEY (product_id) REFERENCES products (id),
          UNIQUE(user_id, product_id)
        )
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS companies (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          logo TEXT,
          website TEXT,
          email TEXT,
          phone TEXT,
          address TEXT,
          city TEXT,
          country TEXT,
          status TEXT DEFAULT 'active',
          commission_rate DECIMAL(5,2) DEFAULT 0.05,
          show_testimonials BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS settings (
          id SERIAL PRIMARY KEY,
          key TEXT UNIQUE NOT NULL,
          value TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS transactions (
          id SERIAL PRIMARY KEY,
          user_id INTEGER,
          product_id INTEGER,
          order_id INTEGER,
          type TEXT NOT NULL,
          amount DECIMAL(10,2) NOT NULL,
          currency TEXT DEFAULT 'USD',
          status TEXT DEFAULT 'pending',
          payment_method TEXT,
          description TEXT,
          notes TEXT,
          metadata TEXT,
          company_id INTEGER,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id),
          FOREIGN KEY (product_id) REFERENCES products (id),
          FOREIGN KEY (order_id) REFERENCES orders (id)
        )
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS user_info (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL,
          full_name TEXT,
          email TEXT,
          phone TEXT,
          optional_phone TEXT,
          address TEXT,
          city TEXT,
          state TEXT,
          zip_code TEXT,
          country TEXT DEFAULT 'Tunisia',
          profile_picture TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id),
          UNIQUE(user_id)
        )
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS testimonials (
          id SERIAL PRIMARY KEY,
          company_id INTEGER NOT NULL,
          title TEXT NOT NULL,
          name TEXT,
          description TEXT NOT NULL,
          image TEXT,
          is_active BOOLEAN DEFAULT true,
          display_order INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (company_id) REFERENCES companies (id)
        )
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS verification_codes (
          id SERIAL PRIMARY KEY,
          email TEXT NOT NULL,
          code TEXT NOT NULL,
          type TEXT DEFAULT 'registration',
          expires_at TIMESTAMP NOT NULL,
          verified BOOLEAN DEFAULT false,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      console.log('✅ PostgreSQL tables initialized');

      const result = await client.query('SELECT id FROM companies LIMIT 1');
      if (result.rows.length === 0) {
        console.log('🌱 Database is empty, seeding initial data...');
        await seedDatabase(this);
      } else {
        console.log('✅ Database already has data');
      }
    } catch (err) {
      console.error('Error initializing tables:', err.message);
    } finally {
      client.release();
    }
  }

  async get(sql, params = []) {
    // Convert SQLite ? placeholders to PostgreSQL $1, $2, etc.
    let paramIndex = 1;
    const pgSql = sql.replace(/\?/g, () => `$${paramIndex++}`);
    const result = await this.pool.query(pgSql, params);
    return result.rows[0];
  }

  async all(sql, params = []) {
    // Convert SQLite ? placeholders to PostgreSQL $1, $2, etc.
    let paramIndex = 1;
    const pgSql = sql.replace(/\?/g, () => `$${paramIndex++}`);
    const result = await this.pool.query(pgSql, params);
    return result.rows;
  }

  async run(sql, params = []) {
    // Convert SQLite ? placeholders to PostgreSQL $1, $2, etc.
    let paramIndex = 1;
    const pgSql = sql.replace(/\?/g, () => `$${paramIndex++}`);
    
    // Check if it's an INSERT query
    if (pgSql.trim().toUpperCase().startsWith('INSERT')) {
      const result = await this.pool.query(pgSql + ' RETURNING id', params);
      return { 
        id: result.rows[0]?.id || null,
        changes: result.rowCount 
      };
    }
    
    const result = await this.pool.query(pgSql, params);
    return { 
      id: result.rows[0]?.id || result.rowCount,
      changes: result.rowCount 
    };
  }

  async close() {
    await this.pool.end();
  }
}

module.exports = new PostgresDatabase();
