const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Test database connection and testimonials table
const dbPath = './backend/database/thrift_shop.db';

console.log('🧪 Testing Testimonials System...\n');

// Test 1: Check if testimonials table exists
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
    return;
  }
  console.log('✅ Database connected successfully');
  
  // Check if testimonials table exists
  db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='testimonials'", (err, row) => {
    if (err) {
      console.error('❌ Error checking testimonials table:', err.message);
      return;
    }
    
    if (row) {
      console.log('✅ Testimonials table exists');
      
      // Check table structure
      db.all("PRAGMA table_info(testimonials)", (err, columns) => {
        if (err) {
          console.error('❌ Error getting table info:', err.message);
          return;
        }
        
        console.log('📋 Testimonials table structure:');
        columns.forEach(col => {
          console.log(`   - ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.pk ? 'PRIMARY KEY' : ''}`);
        });
        
        // Check if companies table has show_testimonials column
        db.all("PRAGMA table_info(companies)", (err, companyColumns) => {
          if (err) {
            console.error('❌ Error getting companies table info:', err.message);
            return;
          }
          
          const hasShowTestimonials = companyColumns.some(col => col.name === 'show_testimonials');
          if (hasShowTestimonials) {
            console.log('✅ Companies table has show_testimonials column');
          } else {
            console.log('❌ Companies table missing show_testimonials column');
          }
          
          // Test inserting sample testimonials
          testInsertTestimonials();
        });
      });
    } else {
      console.log('❌ Testimonials table does not exist');
    }
  });
});

function testInsertTestimonials() {
  console.log('\n🧪 Testing testimonials insertion...');
  
  // Insert sample testimonials for company 1
  const sampleTestimonials = [
    {
      company_id: 1,
      title: 'Recirculate',
      name: 'Recirculate',
      description: 'Landfills are out. Keeping clothes in circulation is in. Send us your clothes, we\'ll do the rest.',
      image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=200&h=200&fit=crop&crop=face',
      is_active: 1,
      display_order: 1
    },
    {
      company_id: 1,
      title: 'Reimagine',
      name: 'Reimagine',
      description: 'Find yourself in our closet as we simplify secondhand. Let our features work for you.',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
      is_active: 1,
      display_order: 2
    },
    {
      company_id: 1,
      title: 'Repeat',
      name: 'Repeat',
      description: 'Where your old fave becomes someone\'s new fave and making an impact comes with the territory.',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face',
      is_active: 1,
      display_order: 3
    }
  ];
  
  // Clear existing testimonials for company 1
  db.run("DELETE FROM testimonials WHERE company_id = 1", (err) => {
    if (err) {
      console.error('❌ Error clearing existing testimonials:', err.message);
      return;
    }
    
    console.log('🧹 Cleared existing testimonials for company 1');
    
    // Insert new testimonials
    const insertStmt = db.prepare(`
      INSERT INTO testimonials (company_id, title, name, description, image, is_active, display_order, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `);
    
    let insertedCount = 0;
    sampleTestimonials.forEach((testimonial, index) => {
      insertStmt.run(
        testimonial.company_id,
        testimonial.title,
        testimonial.name,
        testimonial.description,
        testimonial.image,
        testimonial.is_active,
        testimonial.display_order,
        (err) => {
          if (err) {
            console.error(`❌ Error inserting testimonial ${index + 1}:`, err.message);
          } else {
            insertedCount++;
            console.log(`✅ Inserted testimonial: ${testimonial.title}`);
            
            if (insertedCount === sampleTestimonials.length) {
              insertStmt.finalize();
              testQueryTestimonials();
            }
          }
        }
      );
    });
  });
}

function testQueryTestimonials() {
  console.log('\n🧪 Testing testimonials query...');
  
  // Query active testimonials for company 1
  db.all(`
    SELECT * FROM testimonials 
    WHERE company_id = 1 AND is_active = 1 
    ORDER BY display_order ASC, created_at DESC
  `, (err, rows) => {
    if (err) {
      console.error('❌ Error querying testimonials:', err.message);
      return;
    }
    
    console.log(`✅ Found ${rows.length} active testimonials for company 1:`);
    rows.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.title}: ${row.description.substring(0, 50)}...`);
    });
    
    // Update companies table to enable testimonials
    db.run("UPDATE companies SET show_testimonials = 1 WHERE id = 1", (err) => {
      if (err) {
        console.error('❌ Error updating company testimonials setting:', err.message);
      } else {
        console.log('✅ Enabled testimonials for company 1');
      }
      
      console.log('\n🎉 Testimonials system test completed!');
      console.log('\n📝 Next steps:');
      console.log('   1. Start the backend server: cd backend && npm start');
      console.log('   2. Start the frontend: cd thrift-shop && npm run dev');
      console.log('   3. Start the admin panel: cd admin-panel && npm start');
      console.log('   4. Test the testimonials management in admin panel');
      console.log('   5. Check testimonials display on homepage');
      
      db.close();
    });
  });
}