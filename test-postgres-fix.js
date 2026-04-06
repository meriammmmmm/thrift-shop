// Quick test to verify PostgreSQL placeholder conversion
function testPlaceholderConversion() {
  const sql = "SELECT * FROM products WHERE company_id = ? AND category = ? LIMIT ?";
  
  // Correct conversion
  let paramIndex = 1;
  const pgSql = sql.replace(/\?/g, () => `$${paramIndex++}`);
  
  console.log('Original SQL:', sql);
  console.log('Converted SQL:', pgSql);
  console.log('Expected:', 'SELECT * FROM products WHERE company_id = $1 AND category = $2 LIMIT $3');
  console.log('Match:', pgSql === 'SELECT * FROM products WHERE company_id = $1 AND category = $2 LIMIT $3');
}

testPlaceholderConversion();
