#!/usr/bin/env node

/**
 * Final Migration Script - Local DB to Render
 */

const Database = require('./backend/node_modules/better-sqlite3');
const path = require('path');
const readline = require('readline');

const DB_PATH = path.join(__dirname, 'backend/database/thrift_shop.db');
const RENDER_BACKEND_URL = 'https://mery-rose-backend.onrender.com';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function loginAdmin(email, password) {
  console.log(`🔐 Logging in as ${email}...`);
  
  const response = await fetch(`${RENDER_BACKEND_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
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
  
  const db = new Database(DB_PATH, { readonly: true });
  const products = db.prepare('SELECT * FROM products').all();
  db.close();

  const parsedProducts = products.map(product => ({
    ...product,
    images: product.images ? JSON.parse(product.images) : [],
    measurements: product.measurements ? JSON.parse(product.measurements) : null,
    care_instructions: product.care_instructions ? JSON.parse(product.care_instructions) : [],
    tags: product.tags ? JSON.parse(product.tags) : [],
  }));

  console.log(`✅ Found ${parsedProducts.length} products\n`);
  return parsedProducts;
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
    throw new Error(`${response.status} - ${error.substring(0, 150)}`);
  }

  return await response.json();
}

async function migrate() {
  try {
    console.log('🚀 Migrating products from local database to Render\n');

    // Get products
    const products = await getLocalProducts();

    if (products.length === 0) {
      console.log('⚠️  No products found');
      rl.close();
      return;
    }

    // Ask for credentials
    console.log('Please enter your Render backend admin credentials:');
    const email = await question('Email: ');
    const password = await question('Password: ');
    console.log('');

    // Login
    const token = await loginAdmin(email, password);

    // Import products
    console.log('📤 Importing products...');
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
        console.error(`   ❌ [${i + 1}/${products.length}] ${product.name}`);
        console.error(`      ${error.message}`);
      }
    }

    console.log('\n🎉 Migration complete!');
    console.log(`   ✅ Success: ${successCount} products`);
    if (failCount > 0) {
      console.log(`   ❌ Failed: ${failCount} products`);
    }

    rl.close();

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    rl.close();
    process.exit(1);
  }
}

migrate();
