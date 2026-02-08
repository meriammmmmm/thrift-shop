const db = require('./database/db');

console.log('🧪 Testing Testimonials System Setup...\n');

async function testTestimonialsSystem() {
  try {
    // Test 1: Insert sample testimonials for company 1
    console.log('📝 Inserting sample testimonials...');
    
    // Clear existing testimonials for company 1
    await db.run("DELETE FROM testimonials WHERE company_id = 1");
    console.log('🧹 Cleared existing testimonials for company 1');
    
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
    
    // Insert testimonials
    for (const testimonial of sampleTestimonials) {
      const result = await db.run(`
        INSERT INTO testimonials (company_id, title, name, description, image, is_active, display_order, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `, [
        testimonial.company_id,
        testimonial.title,
        testimonial.name,
        testimonial.description,
        testimonial.image,
        testimonial.is_active,
        testimonial.display_order
      ]);
      
      console.log(`✅ Inserted testimonial: ${testimonial.title} (ID: ${result.id})`);
    }
    
    // Test 2: Query testimonials
    console.log('\n🔍 Querying testimonials...');
    const testimonials = await db.all(`
      SELECT * FROM testimonials 
      WHERE company_id = 1 AND is_active = 1 
      ORDER BY display_order ASC, created_at DESC
    `);
    
    console.log(`✅ Found ${testimonials.length} active testimonials for company 1:`);
    testimonials.forEach((testimonial, index) => {
      console.log(`   ${index + 1}. ${testimonial.title}: ${testimonial.description.substring(0, 50)}...`);
    });
    
    // Test 3: Update company settings
    console.log('\n⚙️ Updating company settings...');
    await db.run("UPDATE companies SET show_testimonials = 1 WHERE id = 1");
    console.log('✅ Enabled testimonials for company 1');
    
    // Test 4: Verify company settings
    const company = await db.get("SELECT * FROM companies WHERE id = 1");
    if (company) {
      console.log(`✅ Company 1 testimonials setting: ${company.show_testimonials ? 'ENABLED' : 'DISABLED'}`);
    } else {
      console.log('❌ Company 1 not found');
    }
    
    console.log('\n🎉 Testimonials system setup completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Start the backend server: npm start');
    console.log('   2. Start the frontend: cd ../thrift-shop && npm run dev');
    console.log('   3. Start the admin panel: cd ../admin-panel && npm start');
    console.log('   4. Test the testimonials management in admin panel');
    console.log('   5. Check testimonials display on homepage');
    
  } catch (error) {
    console.error('❌ Error setting up testimonials system:', error);
  }
}

testTestimonialsSystem();