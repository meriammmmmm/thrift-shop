const Database = require('./backend/node_modules/better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'backend/database/thrift_shop.db');

const db = new Database(DB_PATH, { readonly: true });

console.log('👥 Users in database:');
const users = db.prepare('SELECT id, email, role, admin_company_id FROM users').all();
users.forEach(user => {
  console.log(`  - ${user.email} (role: ${user.role}, company: ${user.admin_company_id})`);
});

console.log('\n🏢 Companies in database:');
const companies = db.prepare('SELECT id, name FROM companies').all();
companies.forEach(company => {
  console.log(`  - ${company.name} (id: ${company.id})`);
});

console.log('\n📦 Products in database:');
const products = db.prepare('SELECT id, name, company_id FROM products').all();
products.forEach(product => {
  console.log(`  - ${product.name} (company: ${product.company_id})`);
});

db.close();
