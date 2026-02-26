const db = require('./database/db');

async function test() {
  try {
    console.log('Testing PostgreSQL connection...');
    
    // Test SELECT
    const companies = await db.all('SELECT * FROM companies LIMIT 1');
    console.log('✅ SELECT works:', companies.length, 'companies');
    
    // Test INSERT
    const result = await db.run(
      'INSERT INTO products (name, price, brand, category, company_id) VALUES (?, ?, ?, ?, ?)',
      ['Test Product', 99.99, 'Test Brand', 'Test Category', 1]
    );
    console.log('✅ INSERT works, ID:', result.id);
    
    // Test UPDATE
    await db.run('UPDATE products SET price = ? WHERE id = ?', [89.99, result.id]);
    console.log('✅ UPDATE works');
    
    // Test DELETE
    await db.run('DELETE FROM products WHERE id = ?', [result.id]);
    console.log('✅ DELETE works');
    
    console.log('\n🎉 All tests passed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

test();
