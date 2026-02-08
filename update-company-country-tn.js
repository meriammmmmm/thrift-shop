const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'backend', 'database', 'thrift_shop.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error opening database:', err.message);
    process.exit(1);
  }
  console.log('✅ Connected to database');
});

// First, check current company data
db.get('SELECT * FROM companies WHERE id = 1', [], (err, row) => {
  if (err) {
    console.error('❌ Error fetching company:', err.message);
    db.close();
    process.exit(1);
  }

  console.log('\n📊 Current Company 1 Data:');
  console.log(row);

  // Update company country to TN (Tunisia)
  db.run(
    'UPDATE companies SET country = ? WHERE id = 1',
    ['TN'],
    function(err) {
      if (err) {
        console.error('❌ Error updating company:', err.message);
        db.close();
        process.exit(1);
      }

      console.log('\n✅ Updated company country to TN');
      console.log(`   Rows affected: ${this.changes}`);

      // Verify the update
      db.get('SELECT * FROM companies WHERE id = 1', [], (err, updatedRow) => {
        if (err) {
          console.error('❌ Error verifying update:', err.message);
        } else {
          console.log('\n📊 Updated Company 1 Data:');
          console.log(updatedRow);
        }

        db.close((err) => {
          if (err) {
            console.error('❌ Error closing database:', err.message);
          } else {
            console.log('\n✅ Database closed');
            console.log('\n🎉 Done! Now refresh your browser at localhost:3000 to see "DT" currency');
          }
        });
      });
    }
  );
});
