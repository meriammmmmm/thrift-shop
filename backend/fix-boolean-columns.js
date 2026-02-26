const db = require('./database/db');

async function fixBooleanColumns() {
  console.log('🔧 Fixing boolean columns in PostgreSQL...');
  
  try {
    // Fix in_stock column in products table
    console.log('Fixing products.in_stock column...');
    await db.run(`
      UPDATE products 
      SET in_stock = CASE 
        WHEN in_stock::text = '1' OR in_stock::text = 'true' THEN true 
        ELSE false 
      END
    `);
    
    // Fix is_active column in testimonials table
    console.log('Fixing testimonials.is_active column...');
    await db.run(`
      UPDATE testimonials 
      SET is_active = CASE 
        WHEN is_active::text = '1' OR is_active::text = 'true' THEN true 
        ELSE false 
      END
    `);
    
    // Fix show_testimonials column in companies table
    console.log('Fixing companies.show_testimonials column...');
    await db.run(`
      UPDATE companies 
      SET show_testimonials = CASE 
        WHEN show_testimonials::text = '1' OR show_testimonials::text = 'true' THEN true 
        ELSE false 
      END
    `);
    
    console.log('✅ Boolean columns fixed successfully!');
    console.log('');
    console.log('Verification:');
    
    // Verify products
    const products = await db.all('SELECT id, name, in_stock FROM products LIMIT 5');
    console.log('Sample products:', products);
    
    // Verify testimonials
    const testimonials = await db.all('SELECT id, title, is_active FROM testimonials LIMIT 5');
    console.log('Sample testimonials:', testimonials);
    
    // Verify companies
    const companies = await db.all('SELECT id, name, show_testimonials FROM companies LIMIT 5');
    console.log('Sample companies:', companies);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing boolean columns:', error);
    process.exit(1);
  }
}

fixBooleanColumns();
