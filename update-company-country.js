const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'backend', 'database', 'thrift_shop.db');
const db = new Database(dbPath);

try {
  // Update Company 1 to have country TN (Tunisia)
  const result = db.prepare(`UPDATE companies SET country = 'TN' WHERE id = 1`).run();
  
  console.log('✅ Successfully updated Company 1 country to TN (Tunisia)');
  console.log('The currency will now show as DT instead of $');
  console.log('Please refresh your browser to see the changes.');
  
  // Verify the update
  const company = db.prepare('SELECT id, name, country FROM companies WHERE id = 1').get();
  console.log('\nCompany details:', company);
} catch (err) {
  console.error('Error updating company:', err);
} finally {
  db.close();
}
