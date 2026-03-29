// Check if PostgreSQL is available (Railway auto-sets DATABASE_URL)
if (process.env.DATABASE_URL) {
  console.log('🐘 PostgreSQL detected - using PostgreSQL database');
  module.exports = require('./db-postgres');
  return;
}

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const seedDatabase = require('./seed-data');

// Use persistent volume on Railway, or local path otherwise
let dbPath = process.env.DB_PATH || './database/thrift_shop.db';

console.log('🔍 Environment check:');
console.log('- RAILWAY_ENVIRONMENT:', process.env.RAILWAY_ENVIRONMENT);
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- Initial DB_PATH:', dbPath);

// On Railway, use the mounted volume
if (process.env.RAILWAY_ENVIRONMENT) {
  dbPath = '/app/database/thrift_shop.db';
  console.log('🚂 Railway detected - using persistent volume for database');
}

console.log('- Final dbPath:', dbPath);

// Check if we can write to the filesystem
try {
  const dbDir = path.dirname(dbPath);
  console.log('- Checking directory:', dbDir);
  
  if (!fs.existsSync(dbDir)) {
    console.log('- Directory does not exist, creating...');
    fs.mkdirSync(dbDir, { recursive: true });
  }
  
  // Test write access
  fs.accessSync(dbDir, fs.constants.W_OK);
  console.log('✅ Database directory is writable:', dbDir);
} catch (err) {
  console.error('⚠️ Cannot write to filesystem:', err.message);
  console.warn('⚠️ Using in-memory database - DATA WILL BE LOST ON RESTART!');
  dbPath = ':memory:';
}

class DatabaseWrapper {
  constructor() {
    try {
      this.db = new Database(dbPath);
      console.log('📦 Connected to SQLite database at:', dbPath);
      this.initTables();
      
      // Only seed if database is completely empty (no companies exist)
      if (dbPath !== ':memory:') {
        this.checkAndSeedIfEmpty();
      } else {
        // For in-memory, seed after a delay
        setTimeout(() => seedDatabase(this), 1000);
      }
    } catch (err) {
      console.error('❌ Error opening database:', err.message);
      console.error('Database path attempted:', dbPath);
      // Don't throw - let the app start even if DB fails
      this.db = null;
    }
  }

  async checkAndSeedIfEmpty() {
    try {
      const company = await this.get('SELECT id FROM companies LIMIT 1');
      if (!company) {
        console.log('🌱 Database is empty, seeding initial data...');
        await seedDatabase(this);
      } else {
        console.log('✅ Database already has data, skipping seed');
        // Check if products exist, if not seed them
        const products = await this.get('SELECT id FROM products LIMIT 1');
        if (!products) {
          console.log('🌱 No products found, seeding products...');
          await seedDatabase(this);
        }
      }
    } catch (err) {
      console.error('Error checking database:', err.message);
    }
  }

  initTables() {
    if (!this.db) {
      console.error('⚠️ Database not initialized, skipping table creation');
      return;
    }
    
    const tables = [
      // Users table
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        name TEXT,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'USER',
        profile_picture TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Products table
      `CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL,
        original_price REAL,
        images TEXT, -- JSON array
        brand TEXT,
        size TEXT,
        category TEXT,
        condition TEXT,
        color TEXT,
        in_stock BOOLEAN DEFAULT 1,
        visible BOOLEAN DEFAULT 1,
        material TEXT,
        measurements TEXT, -- JSON object
        care_instructions TEXT, -- JSON array
        tags TEXT, -- JSON array
        seller_name TEXT,
        seller_rating REAL,
        seller_location TEXT,
        views INTEGER DEFAULT 0,
        likes INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Orders table
      `CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        status TEXT DEFAULT 'PENDING',
        total REAL NOT NULL,
        subtotal REAL NOT NULL,
        tax REAL NOT NULL,
        shipping REAL NOT NULL,
        payment_method TEXT,
        payment_id TEXT,
        shipping_address TEXT, -- JSON object
        billing_address TEXT, -- JSON object
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )`,

      // Order items table
      `CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        price REAL NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders (id),
        FOREIGN KEY (product_id) REFERENCES products (id)
      )`,

      // Wishlist table
      `CREATE TABLE IF NOT EXISTS wishlist (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (product_id) REFERENCES products (id),
        UNIQUE(user_id, product_id)
      )`,

      // Reviews table
      `CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        rating INTEGER NOT NULL,
        comment TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (product_id) REFERENCES products (id)
      )`,

      // Cart table
      `CREATE TABLE IF NOT EXISTS cart (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (product_id) REFERENCES products (id),
        UNIQUE(user_id, product_id)
      )`,

      // Companies table for multi-company marketplace
      `CREATE TABLE IF NOT EXISTS companies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        logo TEXT,
        website TEXT,
        email TEXT,
        phone TEXT,
        address TEXT,
        city TEXT,
        country TEXT,
        status TEXT DEFAULT 'active', -- 'active', 'inactive', 'suspended'
        commission_rate REAL DEFAULT 0.05, -- 5% default commission
        show_testimonials BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Settings table for theme and other configurations
      `CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT UNIQUE NOT NULL,
        value TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Transactions table
      `CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        product_id INTEGER,
        order_id INTEGER,
        type TEXT NOT NULL, -- 'purchase', 'refund', 'payment', 'commission'
        amount REAL NOT NULL,
        currency TEXT DEFAULT 'USD',
        status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'cancelled', 'refunded'
        payment_method TEXT,
        description TEXT,
        notes TEXT,
        metadata TEXT, -- JSON object for additional data
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (product_id) REFERENCES products (id),
        FOREIGN KEY (order_id) REFERENCES orders (id)
      )`,

      // User information table for personal details
      `CREATE TABLE IF NOT EXISTS user_info (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
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
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        UNIQUE(user_id)
      )`,

      // Testimonials table for company testimonials/reviews
      `CREATE TABLE IF NOT EXISTS testimonials (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        company_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        name TEXT,
        description TEXT NOT NULL,
        image TEXT,
        is_active BOOLEAN DEFAULT 1,
        display_order INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (company_id) REFERENCES companies (id)
      )`,

      // Email verification codes table
      `CREATE TABLE IF NOT EXISTS verification_codes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL,
        code TEXT NOT NULL,
        type TEXT DEFAULT 'registration', -- 'registration', 'password_reset'
        expires_at DATETIME NOT NULL,
        verified BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Categories table for custom product categories
      `CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        icon TEXT,
        parent_id INTEGER,
        company_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (company_id) REFERENCES companies (id),
        FOREIGN KEY (parent_id) REFERENCES categories (id)
      )`,

      // Category-Product relationship table
      `CREATE TABLE IF NOT EXISTS category_products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
        UNIQUE(category_id, product_id)
      )`
    ];

    tables.forEach(table => {
      try {
        this.db.exec(table);
      } catch (err) {
        console.error('Error creating table:', err.message);
      }
    });

    // Add profile_picture column to existing tables if it doesn't exist
    this.addProfilePictureColumns();
  }

  addProfilePictureColumns() {
    // Add profile_picture to users table if it doesn't exist
    try {
      this.db.exec(`ALTER TABLE users ADD COLUMN profile_picture TEXT`);
    } catch (err) {
      if (!err.message.includes('duplicate column name')) {
        console.error('Error adding profile_picture to users:', err.message);
      }
    }

    // Add profile_picture to user_info table if it doesn't exist
    try {
      this.db.exec(`ALTER TABLE user_info ADD COLUMN profile_picture TEXT`);
    } catch (err) {
      if (!err.message.includes('duplicate column name')) {
        console.error('Error adding profile_picture to user_info:', err.message);
      }
    }

    // Add admin_id columns for multi-tenant support
    this.addMultiTenantColumns();
  }

  addMultiTenantColumns() {
    // Add company_id to users table (which company the user belongs to)
    try {
      this.db.exec(`ALTER TABLE users ADD COLUMN company_id INTEGER`);
    } catch (err) {
      if (!err.message.includes('duplicate column name')) {
        console.error('Error adding company_id to users:', err.message);
      }
    }

    // Add company_id to products table (which company owns this product)
    try {
      this.db.exec(`ALTER TABLE products ADD COLUMN company_id INTEGER`);
    } catch (err) {
      if (!err.message.includes('duplicate column name')) {
        console.error('Error adding company_id to products:', err.message);
      }
    }

    // Add company_id to orders table (which company's product was ordered)
    try {
      this.db.exec(`ALTER TABLE orders ADD COLUMN company_id INTEGER`);
    } catch (err) {
      if (!err.message.includes('duplicate column name')) {
        console.error('Error adding company_id to orders:', err.message);
      }
    }

    // Add company_id to transactions table (which company's transaction)
    try {
      this.db.exec(`ALTER TABLE transactions ADD COLUMN company_id INTEGER`);
    } catch (err) {
      if (!err.message.includes('duplicate column name')) {
        console.error('Error adding company_id to transactions:', err.message);
      }
    }

    // Add admin_company_id to users table to link admins to companies
    try {
      this.db.exec(`ALTER TABLE users ADD COLUMN admin_company_id INTEGER`);
    } catch (err) {
      if (!err.message.includes('duplicate column name')) {
        console.error('Error adding admin_company_id to users:', err.message);
      }
    }

    // Add logo column to companies table
    try {
      this.db.exec(`ALTER TABLE companies ADD COLUMN logo TEXT`);
    } catch (err) {
      if (!err.message.includes('duplicate column name')) {
        console.error('Error adding logo to companies:', err.message);
      }
    }

    // Add show_testimonials column to companies table
    try {
      this.db.exec(`ALTER TABLE companies ADD COLUMN show_testimonials BOOLEAN DEFAULT 1`);
    } catch (err) {
      if (!err.message.includes('duplicate column name')) {
        console.error('Error adding show_testimonials to companies:', err.message);
      }
    }

    // Add display_order column to products table
    try {
      this.db.exec(`ALTER TABLE products ADD COLUMN display_order INTEGER DEFAULT 0`);
    } catch (err) {
      if (!err.message.includes('duplicate column name')) {
        console.error('Error adding display_order to products:', err.message);
      }
    }

    // Add reservation_status column to products table
    try {
      this.db.exec(`ALTER TABLE products ADD COLUMN reservation_status TEXT DEFAULT 'available'`);
    } catch (err) {
      if (!err.message.includes('duplicate column name')) {
        console.error('Error adding reservation_status to products:', err.message);
      }
    }

    // Add reserved_by_order_id column to products table
    try {
      this.db.exec(`ALTER TABLE products ADD COLUMN reserved_by_order_id INTEGER`);
    } catch (err) {
      if (!err.message.includes('duplicate column name')) {
        console.error('Error adding reserved_by_order_id to products:', err.message);
      }
    }

    // Add visible column to products table
    try {
      this.db.exec(`ALTER TABLE products ADD COLUMN visible BOOLEAN DEFAULT 1`);
      console.log('✅ Added visible column to products table');
      
      // Update existing products to be visible by default
      this.db.exec(`UPDATE products SET visible = 1 WHERE visible IS NULL`);
      console.log('✅ Updated existing products to be visible by default');
    } catch (err) {
      if (!err.message.includes('duplicate column name')) {
        console.error('Error adding visible to products:', err.message);
      }
    }
  }

  // Helper methods - wrapped in promises for compatibility with existing async/await code
  get(sql, params = []) {
    return Promise.resolve().then(() => {
      if (!this.db) throw new Error('Database not initialized');
      try {
        return this.db.prepare(sql).get(...params);
      } catch (err) {
        console.error('DB GET Error:', err.message, 'SQL:', sql);
        throw err;
      }
    });
  }

  all(sql, params = []) {
    return Promise.resolve().then(() => {
      if (!this.db) throw new Error('Database not initialized');
      try {
        return this.db.prepare(sql).all(...params);
      } catch (err) {
        console.error('DB ALL Error:', err.message, 'SQL:', sql);
        throw err;
      }
    });
  }

  run(sql, params = []) {
    return Promise.resolve().then(() => {
      if (!this.db) throw new Error('Database not initialized');
      try {
        const stmt = this.db.prepare(sql);
        const result = stmt.run(...params);
        return { id: result.lastInsertRowid, changes: result.changes };
      } catch (err) {
        console.error('DB RUN Error:', err.message, 'SQL:', sql);
        throw err;
      }
    });
  }

  close() {
    return Promise.resolve().then(() => {
      if (this.db) this.db.close();
    });
  }
}

module.exports = new DatabaseWrapper();