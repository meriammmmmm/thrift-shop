const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = process.env.DB_PATH || './database/thrift_shop.db';

class Database {
  constructor() {
    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error opening database:', err.message);
      } else {
        console.log('📦 Connected to SQLite database');
        this.initTables();
      }
    });
  }

  initTables() {
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
      )`
    ];

    tables.forEach(table => {
      this.db.run(table, (err) => {
        if (err) {
          console.error('Error creating table:', err.message);
        }
      });
    });

    // Add profile_picture column to existing tables if it doesn't exist
    this.addProfilePictureColumns();
  }

  addProfilePictureColumns() {
    // Add profile_picture to users table if it doesn't exist
    this.db.run(`ALTER TABLE users ADD COLUMN profile_picture TEXT`, (err) => {
      if (err && !err.message.includes('duplicate column name')) {
        console.error('Error adding profile_picture to users:', err.message);
      }
    });

    // Add profile_picture to user_info table if it doesn't exist
    this.db.run(`ALTER TABLE user_info ADD COLUMN profile_picture TEXT`, (err) => {
      if (err && !err.message.includes('duplicate column name')) {
        console.error('Error adding profile_picture to user_info:', err.message);
      }
    });

    // Add admin_id columns for multi-tenant support
    this.addMultiTenantColumns();
  }

  addMultiTenantColumns() {
    // Add company_id to users table (which company the user belongs to)
    this.db.run(`ALTER TABLE users ADD COLUMN company_id INTEGER`, (err) => {
      if (err && !err.message.includes('duplicate column name')) {
        console.error('Error adding company_id to users:', err.message);
      }
    });

    // Add company_id to products table (which company owns this product)
    this.db.run(`ALTER TABLE products ADD COLUMN company_id INTEGER`, (err) => {
      if (err && !err.message.includes('duplicate column name')) {
        console.error('Error adding company_id to products:', err.message);
      }
    });

    // Add company_id to orders table (which company's product was ordered)
    this.db.run(`ALTER TABLE orders ADD COLUMN company_id INTEGER`, (err) => {
      if (err && !err.message.includes('duplicate column name')) {
        console.error('Error adding company_id to orders:', err.message);
      }
    });

    // Add company_id to transactions table (which company's transaction)
    this.db.run(`ALTER TABLE transactions ADD COLUMN company_id INTEGER`, (err) => {
      if (err && !err.message.includes('duplicate column name')) {
        console.error('Error adding company_id to transactions:', err.message);
      }
    });

    // Add admin_company_id to users table to link admins to companies
    this.db.run(`ALTER TABLE users ADD COLUMN admin_company_id INTEGER`, (err) => {
      if (err && !err.message.includes('duplicate column name')) {
        console.error('Error adding admin_company_id to users:', err.message);
      }
    });

    // Add logo column to companies table
    this.db.run(`ALTER TABLE companies ADD COLUMN logo TEXT`, (err) => {
      if (err && !err.message.includes('duplicate column name')) {
        console.error('Error adding logo to companies:', err.message);
      }
    });

    // Add show_testimonials column to companies table
    this.db.run(`ALTER TABLE companies ADD COLUMN show_testimonials BOOLEAN DEFAULT 1`, (err) => {
      if (err && !err.message.includes('duplicate column name')) {
        console.error('Error adding show_testimonials to companies:', err.message);
      }
    });
  }

  // Helper methods
  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, changes: this.changes });
      });
    });
  }

  close() {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}

module.exports = new Database();