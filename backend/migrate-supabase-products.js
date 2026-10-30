require('dotenv').config();
const { Pool } = require('pg');
const https = require('https');

const SUPABASE_URL = 'https://oiwvvxyewszwwfnvsnza.supabase.co/rest/v1';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pd3Z2eHlld3N6d3dmbnZzbnphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjcxMDQ0NjcsImV4cCI6MjA0MjY4MDQ2N30.YdVIDE2y3WWG7z93xvC7lSMMbZ-e-WQnS09O-cIiLxc';

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function migrateProducts() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: false
  });

  try {
    console.log('\n🚀 Starting migration from Supabase to Fly.io PostgreSQL...\n');

    // Fetch company from Supabase
    console.log('📦 Fetching Company ID 2 from Supabase...');
    const companies = await fetchJson(`${SUPABASE_URL}/companies?select=*&id=eq.2&limit=1`);
    console.log('Response:', companies);
    
    if (!companies || companies.length === 0) {
      throw new Error('Company ID 2 not found in Supabase');
    }

    const supabaseCompany = companies[0];
    console.log('✅ Found company:', supabaseCompany.name);

    // Check if company exists in Fly.io, if not create it
    const flyCompanyCheck = await pool.query('SELECT * FROM companies WHERE id = $1', [2]);
    
    if (flyCompanyCheck.rows.length === 0) {
      console.log('📝 Creating company in Fly.io database...');
      await pool.query(`
        INSERT INTO companies (id, name, description, email, phone, address, city, country, status, logo, show_testimonials)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `, [
        supabaseCompany.id,
        supabaseCompany.name,
        supabaseCompany.description || '',
        supabaseCompany.email || '',
        supabaseCompany.phone || '',
        supabaseCompany.address || '',
        supabaseCompany.city || '',
        supabaseCompany.country || '',
        supabaseCompany.status || 'active',
        supabaseCompany.logo || null,
        supabaseCompany.show_testimonials !== false
      ]);
      console.log('✅ Company created in Fly.io');
    } else {
      console.log('✅ Company already exists in Fly.io');
    }

    // Fetch all products for company 2 from Supabase
    console.log('\n📦 Fetching products from Supabase...');
    let allProducts = [];
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const products = await fetchJson(
        `${SUPABASE_URL}/products?select=*&company_id=eq.2&order=display_order.asc,id.asc&limit=100&offset=${offset}`
      );
      allProducts = allProducts.concat(products);
      
      console.log(`   Fetched ${products.length} products (offset: ${offset})`);
      
      if (products.length < 100) {
        hasMore = false;
      } else {
        offset += 100;
      }
    }

    console.log(`\n✅ Total products fetched: ${allProducts.length}`);

    // Insert products into Fly.io database
    console.log('\n📥 Inserting products into Fly.io PostgreSQL...');
    let inserted = 0;
    let skipped = 0;

    for (const product of allProducts) {
      try {
        // Check if product already exists
        const existing = await pool.query('SELECT id FROM products WHERE id = $1', [product.id]);
        
        if (existing.rows.length > 0) {
          console.log(`   ⏭️  Skipping product ${product.id}: ${product.name} (already exists)`);
          skipped++;
          continue;
        }

        // Insert product
        await pool.query(`
          INSERT INTO products (
            id, name, description, price, original_price, images, brand, size, 
            category, condition, color, in_stock, visible, material, measurements,
            care_instructions, tags, seller_name, seller_rating, seller_location,
            views, likes, company_id, display_order, reservation_status, 
            reserved_by_order_id, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
            $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28
          )
        `, [
          product.id,
          product.name,
          product.description,
          product.price,
          product.original_price,
          product.images,
          product.brand,
          product.size,
          product.category,
          product.condition,
          product.color,
          product.in_stock !== false,
          product.visible !== false,
          product.material,
          product.measurements,
          product.care_instructions,
          product.tags,
          product.seller_name,
          product.seller_rating,
          product.seller_location,
          product.views || 0,
          product.likes || 0,
          product.company_id,
          product.display_order || 0,
          product.reservation_status || 'available',
          product.reserved_by_order_id,
          product.created_at,
          product.updated_at
        ]);

        console.log(`   ✅ Inserted product ${product.id}: ${product.name}`);
        inserted++;
      } catch (error) {
        console.error(`   ❌ Error inserting product ${product.id}:`, error.message);
      }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 MIGRATION SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Products inserted: ${inserted}`);
    console.log(`⏭️  Products skipped: ${skipped}`);
    console.log(`📦 Total products: ${allProducts.length}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    await pool.end();
    process.exit(1);
  }
}

migrateProducts();
