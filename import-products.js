#!/usr/bin/env node

/**
 * Import Products from JSON file to Backend
 * 
 * Usage:
 * node import-products.js <backend-url> <json-file>
 * 
 * Example:
 * node import-products.js https://your-render-backend.onrender.com products-export-123456.json
 */

const fs = require('fs');

const BACKEND_URL = process.argv[2] || 'http://localhost:5001';
const JSON_FILE = process.argv[3];
const ADMIN_EMAIL = 'admin@thriftshop.com';
const ADMIN_PASSWORD = 'admin123';

if (!JSON_FILE) {
  console.error('❌ Please provide a JSON file to import');
  console.log('Usage: node import-products.js <backend-url> <json-file>');
  process.exit(1);
}

async function loginAdmin() {
  console.log(`🔐 Logging in to ${BACKEND_URL}...`);
  
  const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
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
    throw new Error(`Login failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  console.log(`✅ Logged in successfully`);
  return data.token;
}

async function importProduct(token, product) {
  // Remove fields that shouldn't be copied
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

  const response = await fetch(`${BACKEND_URL}/api/products`, {
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

async function importProducts() {
  try {
    console.log('🚀 Importing products...\n');

    // Read JSON file
    console.log(`📖 Reading ${JSON_FILE}...`);
    const products = JSON.parse(fs.readFileSync(JSON_FILE, 'utf8'));
    console.log(`   Found ${products.length} products\n`);

    // Login
    const token = await loginAdmin();
    console.log('');

    // Import products
    console.log('📦 Importing products...');
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

    console.log('\n🎉 Import complete!');
    console.log(`   ✅ Success: ${successCount} products`);
    if (failCount > 0) {
      console.log(`   ❌ Failed: ${failCount} products`);
    }

  } catch (error) {
    console.error('\n❌ Import failed:', error.message);
    process.exit(1);
  }
}

importProducts();
