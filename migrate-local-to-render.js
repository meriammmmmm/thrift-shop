#!/usr/bin/env node

/**
 * Migrate Products from Local Database to Render
 */

const sqlite3 = require('sqlite3').verbose();
const { promisify } = require('util');

const LOCAL_DB_PATH = './backend/database/thrift_shop.db';
const RENDER_BACKEND_URL = 'https://mery-rose-backend.onrender.com';
const ADMIN_EMAIL = 'admin@thriftshop.com';
const ADMIN_PASSWORD = 'admin123';

async function loginAdmin() {
  console.log(`🔐 Logging in to Render backend...`);
  
  const response = await fetch(`${RENDER_BACKEND_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Login failed: ${response.status} - ${text}`);
  }

  const data = await response.json();
  console.log(`✅ Logged in successfully\n`);
  return data.token;
}

async function getLocalProducts() {
  console.log(`📦 Reading products from local database...`);
  
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(LOCAL_DB_PATH, sqlite3.OPEN_READONLY, (err) => {
      if (err) {
        reject(err);
        return;
      }
    });

    db.all('SELECT * FROM products', [], (err, rows) => {
      if (err) {
        reject(err);
        return;
      }

      // Parse JSON fields
      const products = rows.map(product => ({
        ...product,
        images: product.images ? JSON.parse(product.images) : [],
        measurements: product.measurements ? JSON.parse(product.measurements) : null,
        care_instructions: product.care_instructions ? JSON.parse(product.care_instructions) : [],
        tags: product.tags ? JSON.parse(product.tags) : [],
      }));

      console.log(`✅ Found ${products.length} products\n`);
      db.close();
      resolve(products);
    });
  });
}

async function importProduct(token, product) {
  const productData = {
    name: product.name,
    description: product.description,
    price: product.price,
    original_price: product.original_price,
    images: product.images,
    brand: product.brand,
    size: product.size,
    category: product.category,
    condition: product.condition,
    color: product.color,
    material: product.material,
    measurements: product.measurements,
    care_instructions: product.care_instructions,
    tags: product.tags,
    seller_name: product.seller_name,
    seller_rating: product.seller_rating,
    seller_location: product.seller_location,
    visible: product.visible !== false,
  };

  const response = await fetch(`${RENDER_BACKEND_URL}/api/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(productData),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`${response.status} - ${error}`);
  }

  return await response.json();
}

async function migrate() {
  try {
    console.log('🚀 Starting migration from local database to Render...\n');

    // Get products from local database
    const products = await getLocalProducts();

    if (products.length === 0) {
      console.log('⚠️  No products found in local database');
      return;
    }

    // Login to Render
    const token = await loginAdmin();

    // Import products
    console.log('📤 Importing products to Render...');
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      try {
        await importProduct(token, product);
        successCount++;
        console.log(`   ✅ [${i + 1}/${products.length}] ${product.name}`);
      } catch (error) {
        failCount++;
        console.error(`   ❌ [${i + 1}/${products.length}] ${product.name} - ${error.message}`);
      }
    }

    console.log('\n🎉 Migration complete!');
    console.log(`   ✅ Success: ${successCount} products`);
    if (failCount > 0) {
      console.log(`   ❌ Failed: ${failCount} products`);
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

migrate();
