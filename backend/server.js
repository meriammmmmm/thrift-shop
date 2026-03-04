const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const adminRoutes = require('./routes/admin');
const userRoutes = require('./routes/users');
const cartRoutes = require('./routes/cart');
const wishlistRoutes = require('./routes/wishlist');
const settingsRoutes = require('./routes/settings');
const transactionsRoutes = require('./routes/transactions');
const companiesRoutes = require('./routes/companies');
const categoriesRoutes = require('./routes/categories');
const testimonialsRoutes = require('./routes/testimonials');
const aiRoutes = require('./routes/ai');
const db = require('./database/db');

const app = express();
const PORT = process.env.PORT || 5001;

// CORS configuration - MUST come first, before any other middleware
app.options('*', cors()); // Enable pre-flight for all routes

app.use(cors({
  origin: true, // Allow all origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  optionsSuccessStatus: 200,
  maxAge: 86400 // 24 hours
}));

// Additional CORS headers as backup
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Security middleware - configured to not interfere with CORS
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false
}));

// Rate limiting - Disabled for development
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100 // limit each IP to 100 requests per windowMs
// });
// app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin/categories', categoriesRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use('/api/companies', companiesRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/testimonials', testimonialsRoutes);
app.use('/api/ai', aiRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Thrift Shop Backend is running!',
    timestamp: new Date().toISOString(),
    cors: 'enabled'
  });
});

// Fix sequences endpoint (call once after migration)
app.get('/api/fix-sequences', async (req, res) => {
  try {
    if (!process.env.DATABASE_URL) {
      return res.json({ error: 'Not using PostgreSQL' });
    }
    
    const { Pool } = require('pg');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    
    const tables = ['users', 'products', 'orders', 'order_items', 'companies', 'settings', 'transactions', 'user_info', 'testimonials', 'verification_codes', 'wishlist', 'reviews', 'cart'];
    const results = [];
    
    for (const table of tables) {
      try {
        await pool.query(`SELECT setval(pg_get_serial_sequence('${table}', 'id'), COALESCE((SELECT MAX(id) FROM ${table}), 1), true)`);
        results.push(`✅ Fixed ${table}`);
      } catch (err) {
        results.push(`⚠️ Skipped ${table}: ${err.message}`);
      }
    }
    
    await pool.end();
    res.json({ success: true, results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Fix boolean columns endpoint (call once after migration to fix 0/1 to true/false)
app.get('/api/fix-boolean-columns', async (req, res) => {
  try {
    if (!process.env.DATABASE_URL) {
      return res.json({ error: 'Not using PostgreSQL' });
    }
    
    const results = [];
    
    // Fix in_stock column in products table
    try {
      await db.run(`
        UPDATE products 
        SET in_stock = CASE 
          WHEN in_stock::text = '1' OR in_stock::text = 'true' THEN true 
          ELSE false 
        END
      `);
      results.push('✅ Fixed products.in_stock');
    } catch (err) {
      results.push(`⚠️ Error fixing products.in_stock: ${err.message}`);
    }
    
    // Fix is_active column in testimonials table
    try {
      await db.run(`
        UPDATE testimonials 
        SET is_active = CASE 
          WHEN is_active::text = '1' OR is_active::text = 'true' THEN true 
          ELSE false 
        END
      `);
      results.push('✅ Fixed testimonials.is_active');
    } catch (err) {
      results.push(`⚠️ Error fixing testimonials.is_active: ${err.message}`);
    }
    
    // Fix show_testimonials column in companies table
    try {
      await db.run(`
        UPDATE companies 
        SET show_testimonials = CASE 
          WHEN show_testimonials::text = '1' OR show_testimonials::text = 'true' THEN true 
          ELSE false 
        END
      `);
      results.push('✅ Fixed companies.show_testimonials');
    } catch (err) {
      results.push(`⚠️ Error fixing companies.show_testimonials: ${err.message}`);
    }
    
    res.json({ success: true, results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CORS test endpoint
app.get('/api/cors-test', (req, res) => {
  res.json({
    message: 'CORS is working!',
    origin: req.headers.origin || 'no-origin',
    method: req.method,
    headers: req.headers
  });
});

app.post('/api/cors-test', (req, res) => {
  res.json({
    message: 'CORS POST is working!',
    origin: req.headers.origin || 'no-origin',
    method: req.method,
    body: req.body
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Run inventory migration on startup
async function fixInventoryOnStartup() {
  try {
    console.log('🔧 Running inventory migration...');
    
    // Fix CONFIRMED/SHIPPED/DELIVERED orders
    const completedOrders = await db.all(`
      SELECT DISTINCT oi.product_id 
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status IN ('CONFIRMED', 'SHIPPED', 'DELIVERED')
    `);
    
    for (const item of completedOrders) {
      await db.run(`
        UPDATE products 
        SET in_stock = 0,
            reservation_status = 'sold',
            reserved_by_order_id = NULL
        WHERE id = ?
      `, [item.product_id]);
    }
    
    console.log(`✅ Fixed ${completedOrders.length} sold products`);
    
    // Fix PROCESSING orders
    const processingOrders = await db.all(`
      SELECT oi.product_id, o.id as order_id
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status = 'PROCESSING'
    `);
    
    for (const item of processingOrders) {
      await db.run(`
        UPDATE products 
        SET in_stock = 1,
            reservation_status = 'reserved',
            reserved_by_order_id = ?
        WHERE id = ?
      `, [item.order_id, item.product_id]);
    }
    
    console.log(`✅ Fixed ${processingOrders.length} reserved products`);
    console.log('✅ Inventory migration complete!');
  } catch (error) {
    console.error('❌ Inventory migration error:', error);
  }
}

app.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 Thrift Shop Backend running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL}`);
  console.log(`📁 Database path: ${process.env.DB_PATH || './database/thrift_shop.db'}`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Run inventory fix
  await fixInventoryOnStartup();
});