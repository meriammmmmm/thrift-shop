const db = require('../database/db');
const bcrypt = require('bcryptjs');

async function setupCompanies() {
  try {
    console.log('🏢 Setting up multi-company marketplace...');

    // Create default companies
    const companies = [
      {
        name: 'Vintage Treasures',
        description: 'Premium vintage clothing and accessories from the 60s-90s',
        email: 'admin@vintagetreasures.com',
        phone: '+1-555-0101',
        address: '123 Vintage Street',
        city: 'New York',
        country: 'USA',
        commission_rate: 0.05
      },
      {
        name: 'Eco Fashion Hub',
        description: 'Sustainable and eco-friendly thrift clothing',
        email: 'admin@ecofashionhub.com',
        phone: '+1-555-0102',
        address: '456 Green Avenue',
        city: 'San Francisco',
        country: 'USA',
        commission_rate: 0.04
      },
      {
        name: 'Retro Style Co',
        description: 'Curated retro and vintage fashion pieces',
        email: 'admin@retrostyleco.com',
        phone: '+1-555-0103',
        address: '789 Retro Boulevard',
        city: 'Los Angeles',
        country: 'USA',
        commission_rate: 0.06
      }
    ];

    // Insert companies
    for (const company of companies) {
      const result = await db.run(
        `INSERT INTO companies (name, description, email, phone, address, city, country, commission_rate)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [company.name, company.description, company.email, company.phone, company.address, company.city, company.country, company.commission_rate]
      );
      console.log(`✅ Created company: ${company.name} (ID: ${result.id})`);

      // Create admin user for each company
      const hashedPassword = await bcrypt.hash('admin123', 12);
      const adminResult = await db.run(
        `INSERT INTO users (email, password, name, role, admin_company_id)
         VALUES (?, ?, ?, ?, ?)`,
        [company.email, hashedPassword, `${company.name} Admin`, 'ADMIN', result.id]
      );
      console.log(`✅ Created admin user for ${company.name}: ${company.email}`);
    }

    // Update existing products to belong to random companies (for demo)
    const existingProducts = await db.all('SELECT id FROM products WHERE company_id IS NULL');
    if (existingProducts.length > 0) {
      console.log(`📦 Updating ${existingProducts.length} existing products...`);
      for (const product of existingProducts) {
        const randomCompanyId = Math.floor(Math.random() * 3) + 1; // Random company 1-3
        await db.run('UPDATE products SET company_id = ? WHERE id = ?', [randomCompanyId, product.id]);
      }
      console.log('✅ Updated existing products with company assignments');
    }

    // Update existing orders to belong to companies based on their products
    const existingOrders = await db.all(`
      SELECT DISTINCT o.id, oi.product_id, p.company_id
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      JOIN products p ON oi.product_id = p.id
      WHERE o.company_id IS NULL
    `);
    
    if (existingOrders.length > 0) {
      console.log(`📋 Updating ${existingOrders.length} existing orders...`);
      for (const order of existingOrders) {
        if (order.company_id) {
          await db.run('UPDATE orders SET company_id = ? WHERE id = ?', [order.company_id, order.id]);
        }
      }
      console.log('✅ Updated existing orders with company assignments');
    }

    console.log('\n🎉 Multi-company marketplace setup complete!');
    console.log('\n📋 Company Admin Credentials:');
    companies.forEach((company, index) => {
      console.log(`\n${index + 1}. ${company.name}`);
      console.log(`   Email: ${company.email}`);
      console.log(`   Password: admin123`);
      console.log(`   Description: ${company.description}`);
    });

    console.log('\n🔗 Access your admin panels at:');
    console.log('   http://localhost:8080 (Admin Panel)');
    console.log('\n👥 Users will see products from all companies in the main store:');
    console.log('   http://localhost:3000 (Customer Store)');

  } catch (error) {
    console.error('❌ Error setting up companies:', error);
  }
}

// Run setup if called directly
if (require.main === module) {
  setupCompanies().then(() => {
    console.log('\n✨ Setup completed successfully!');
    process.exit(0);
  }).catch(error => {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  });
}

module.exports = { setupCompanies };