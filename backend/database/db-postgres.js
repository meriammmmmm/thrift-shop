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
      ssl: connectionString.includes('supabase') || connectionString.includes('pooler') 
        ? { rejectUnauthorized: false } 
        : false,
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 30000,
      max: 3,              // ✅ FIXED: was 20, free tiers allow very few connections
      allowExitOnIdle: false
    });

    // ✅ FIXED: Prevent uncaught pool errors from crashing the server
    this.pool.on('error', (err) => {
      console.error('⚠️ Unexpected PostgreSQL pool error:', err.message);
    });

    console.log('🐘 Connected to PostgreSQL database');
    
    // ✅ FIXED: Don't await this — let server start regardless
    this.initTables().catch(err => {
      console.error('⚠️ initTables failed on startup (non-fatal):', err.message);
    });
  }

  async initTables() {
    let client;
    try {
      client = await this.pool.connect();
    } catch (err) {
      // ✅ FIXED: If we can't get a connection, log and bail — don't crash
      console.error('⚠️ Could not connect to DB for initTables:', err.message);
      return;
    }

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
          visible BOOLEAN DEFAULT true,
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
          display_order INTEGER DEFAULT 0,
          reservation_status TEXT DEFAULT 'available',
          reserved_by_order_id INTEGER,
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
          currency TEXT DEFAULT 'USD',
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
          status TEXT DEFAULT 'approved',
          source TEXT DEFAULT 'admin',
          user_id INTEGER,
          submitter_email TEXT,
          display_order INTEGER DEFAULT 0,
          rating INTEGER DEFAULT 5,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (company_id) REFERENCES companies (id)
        )
      `);

      // A "this review helped" vote. The visitor key identifies the browser
      // that cast the vote so one person cannot inflate the counter by
      // reloading the page.
      await client.query(`
        CREATE TABLE IF NOT EXISTS testimonial_likes (
          id SERIAL PRIMARY KEY,
          testimonial_id INTEGER NOT NULL,
          visitor_key TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(testimonial_id, visitor_key),
          FOREIGN KEY (testimonial_id) REFERENCES testimonials (id) ON DELETE CASCADE
        )
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS articles (
          id SERIAL PRIMARY KEY,
          company_id INTEGER NOT NULL,
          title TEXT NOT NULL,
          summary TEXT,
          content TEXT NOT NULL,
          image TEXT,
          author TEXT,
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

      await client.query(`
        CREATE TABLE IF NOT EXISTS categories (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          icon TEXT,
          parent_id INTEGER,
          company_id INTEGER NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (company_id) REFERENCES companies (id),
          FOREIGN KEY (parent_id) REFERENCES categories (id)
        )
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS category_products (
          id SERIAL PRIMARY KEY,
          category_id INTEGER NOT NULL,
          product_id INTEGER NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE CASCADE,
          FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
          UNIQUE(category_id, product_id)
        )
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS looks (
          id SERIAL PRIMARY KEY,
          company_id INTEGER NOT NULL,
          name TEXT NOT NULL,
          occasion TEXT,
          tagline TEXT,
          worn_image TEXT,
          is_active BOOLEAN DEFAULT true,
          display_order INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (company_id) REFERENCES companies (id)
        )
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS look_items (
          id SERIAL PRIMARY KEY,
          look_id INTEGER NOT NULL,
          product_id INTEGER NOT NULL,
          sort_order INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (look_id) REFERENCES looks (id) ON DELETE CASCADE,
          FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
          UNIQUE(look_id, product_id)
        )
      `);

      // The worn-outfit photo itself, kept out of `looks.worn_image` so the
      // list endpoints never have to carry megabytes of base64.
      await client.query(`
        CREATE TABLE IF NOT EXISTS look_images (
          look_id INTEGER PRIMARY KEY,
          image TEXT NOT NULL,
          mime TEXT,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (look_id) REFERENCES looks (id) ON DELETE CASCADE
        )
      `);

      console.log('✅ PostgreSQL tables initialized');

      // Run migrations to add missing columns
      console.log('🔄 Running migrations...');
      
      try {
        await client.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS visible BOOLEAN DEFAULT true`);
        console.log('✅ Added visible column to products table');
        const updateResult = await client.query(`UPDATE products SET visible = true WHERE visible IS NULL`);
        console.log(`✅ Updated ${updateResult.rowCount} products to be visible by default`);
      } catch (err) {
        console.log('⚠️ visible column migration:', err.message);
      }

      try {
        await client.query(`ALTER TABLE companies ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD'`);
        console.log('✅ Added currency column to companies table');
        const updateResult = await client.query(`UPDATE companies SET currency = 'USD' WHERE currency IS NULL`);
        console.log(`✅ Updated ${updateResult.rowCount} companies with default currency`);
      } catch (err) {
        console.log('⚠️ currency column migration:', err.message);
      }

      // Reviews submitted from the storefront wait for an admin decision.
      // The columns are added without a default so the backfill below can tell
      // legacy rows apart from reviews that went through the new workflow.
      try {
        await client.query(`ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS status TEXT`);
        await client.query(`ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS source TEXT`);
        await client.query(`ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS user_id INTEGER`);
        await client.query(`ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS submitter_email TEXT`);
        await client.query(`ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS rating INTEGER DEFAULT 5`);
        console.log('✅ Added review workflow columns to testimonials table');

        // Legacy rows: live reviews are approved, the rest still need a
        // decision from the admin.
        await client.query(`
          UPDATE testimonials
          SET status = CASE WHEN is_active THEN 'approved' ELSE 'pending' END
          WHERE status IS NULL OR status = ''
        `);
        await client.query(`
          UPDATE testimonials SET source = 'admin' WHERE source IS NULL OR source = ''
        `);
        // Reviews written before the star rating existed get a neutral score
        // rather than a silent zero.
        await client.query(`
          UPDATE testimonials SET rating = 5 WHERE rating IS NULL
        `);
      } catch (err) {
        console.log('⚠️ testimonial workflow migration:', err.message);
      }

      // Votes on a review.
      try {
        await client.query(`
          CREATE TABLE IF NOT EXISTS testimonial_likes (
            id SERIAL PRIMARY KEY,
            testimonial_id INTEGER NOT NULL,
            visitor_key TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(testimonial_id, visitor_key),
            FOREIGN KEY (testimonial_id) REFERENCES testimonials (id) ON DELETE CASCADE
          )
        `);
        console.log('✅ Ensured testimonial_likes table exists');
      } catch (err) {
        console.log('⚠️ testimonial_likes migration:', err.message);
      }

      const result = await client.query('SELECT id FROM companies LIMIT 1');
      if (result.rows.length === 0) {
        console.log('🌱 Database is empty, seeding initial data...');
        await seedDatabase(this);
      } else {
        console.log('✅ Database already has data');
      }

    } catch (err) {
      // ✅ FIXED: Log but don't crash — server stays alive
      console.error('⚠️ Error initializing tables (non-fatal):', err.message);
    } finally {
      // ✅ FIXED: Always release the client back to the pool
      if (client) client.release();
    }
  }

  async get(sql, params = []) {
      let paramIndex = 1;
      const pgSql = sql.replace(/\?/g, () => `$${paramIndex++}`);
      const result = await this.pool.query(pgSql, params);
      return result.rows[0];
    }

  async all(sql, params = []) {
      let paramIndex = 1;
      const pgSql = sql.replace(/\?/g, () => `$${paramIndex++}`);
      const result = await this.pool.query(pgSql, params);
      return result.rows;
    }

  async run(sql, params = []) {
      let paramIndex = 1;
      const pgSql = sql.replace(/\?/g, () => `$${paramIndex++}`);

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