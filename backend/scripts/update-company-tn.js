const db = require('../database/db');

try {
  // Update Company 1 to have country TN (Tunisia)
  const result = db.prepare(`UPDATE companies SET country = 'TN' WHERE id = 1`).run();
  
  console.log('✅ Successfully updated Company 1 country to TN (Tunisia)');
  console.log('The currency will now show as DT instead of $');
  console.log('Please refresh your browser (http://localhost:3000) to see the changes.');
  
  // Verify the update
  const company = db.prepare('SELECT id, name, country FROM companies WHERE id = 1').get();
  console.log('\nCompany details:', JSON.stringify(company, null, 2));
} catch (err) {
  console.error('Error updating company:', err);
}
