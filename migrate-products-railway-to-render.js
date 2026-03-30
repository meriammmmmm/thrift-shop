#!/usr/bin/env node

/**
 * Migrate Products from Railway to Render
 * 
 * This script fetches all products from your Railway backend
 * and imports them to your Render backend.
 * 
 * Usage:
 * 1. Set your Railway and Render backend URLs below
 * 2. Set your admin credentials
 * 3. Run: node migrate-products-railway-to-render.js
 */

const RAILWAY_BACKEND_URL = 'https://thrift-shop-backend-production.up.railway.app';
const RENDER_BACKEND_URL = 'https://mery-rose-backend.onrender.com';

// Admin credentials for authentication
const ADMIN_EMAIL = 'admin@thriftshop.com';
const ADMIN_PASSWORD = 'admin123';

async function loginAdmin(backendUrl) {
  console.log(`🔐 Logging in to ${backendUrl}...`);
  
  const response = await fetch(`${backendUrl}/api/auth/login`, {
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

async function fetchAllProducts(backendUrl, token) {
  console.log(`📦 Fetching products from ${backendUrl}...`);
  
  let allProducts = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await fetch(`${backendUrl}/api/products?page=${page}&limit=100`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.status}`);
    }

    const data = await response.json();
    allProducts = allProducts.concat(data.products);
    
    console.log(`   Fetched page ${page}: ${data.products.length} products`);
    
    hasMore = data.pagination.page < data.pagination.pages;
    page++;
  }

  console.log(`✅ Total products fetched: ${allProducts.length}`);
  return allProducts;
}

async function importProduct(backendUrl, token, product) {
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
    visible: product.visible !== false, // Default to visible
  };

  const response = await fetch(`${backendUrl}/api/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(productData),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to import product: ${response.status} - ${error}`);
  }

  return await response.json();
}

async function migrateProducts() {
  try {
    console.log('🚀 Starting product migration from Railway to Render...\n');

    // Step 1: Login to Railway backend
    console.log('Step 1: Authenticate with Railway backend');
    const railwayToken = await loginAdmin(RAILWAY_BACKEND_URL);
    console.log('');

    // Step 2: Fetch all products from Railway
    console.log('Step 2: Fetch products from Railway');
    const products = await fetchAllProducts(RAILWAY_BACKEND_URL, railwayToken);
    console.log('');

    // Step 3: Login to Render backend
    console.log('Step 3: Authenticate with Render backend');
    const renderToken = await loginAdmin(RENDER_BACKEND_URL);
    console.log('');

    // Step 4: Import products to Render
    console.log('Step 4: Import products to Render');
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      try {
        await importProduct(RENDER_BACKEND_URL, renderToken, product);
        successCount++;
        console.log(`   ✅ [${i + 1}/${products.length}] Imported: ${product.name}`);
      } catch (error) {
        failCount++;
        console.error(`   ❌ [${i + 1}/${products.length}] Failed: ${product.name} - ${error.message}`);
      }
    }

    console.log('\n🎉 Migration complete!');
    console.log(`   ✅ Successfully imported: ${successCount} products`);
    if (failCount > 0) {
      console.log(`   ❌ Failed: ${failCount} products`);
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run migration
migrateProducts();
