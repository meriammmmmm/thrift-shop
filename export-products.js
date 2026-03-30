#!/usr/bin/env node

/**
 * Export Products from Backend to JSON file
 * 
 * Usage:
 * node export-products.js <backend-url>
 * 
 * Example:
 * node export-products.js https://your-railway-backend.railway.app
 */

const fs = require('fs');

const BACKEND_URL = process.argv[2] || 'http://localhost:5001';
const ADMIN_EMAIL = 'admin@thriftshop.com';
const ADMIN_PASSWORD = 'admin123';

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

async function fetchAllProducts(token) {
  console.log(`📦 Fetching products...`);
  
  let allProducts = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await fetch(`${BACKEND_URL}/api/products?page=${page}&limit=100`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.status}`);
    }

    const data = await response.json();
    allProducts = allProducts.concat(data.products);
    
    console.log(`   Page ${page}: ${data.products.length} products`);
    
    hasMore = data.pagination.page < data.pagination.pages;
    page++;
  }

  console.log(`✅ Total products: ${allProducts.length}`);
  return allProducts;
}

async function exportProducts() {
  try {
    console.log('🚀 Exporting products...\n');

    const token = await loginAdmin();
    const products = await fetchAllProducts(token);

    const filename = `products-export-${Date.now()}.json`;
    fs.writeFileSync(filename, JSON.stringify(products, null, 2));

    console.log(`\n✅ Products exported to: ${filename}`);
    console.log(`   Total: ${products.length} products`);

  } catch (error) {
    console.error('\n❌ Export failed:', error.message);
    process.exit(1);
  }
}

exportProducts();
