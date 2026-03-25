const db = require('./database/db');

const defaultCategories = [
  {
    name: 'Night Out',
    description: 'Glamorous outfits for parties and nightlife',
    icon: '<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>'
  },
  {
    name: 'Casual',
    description: 'Comfortable daily wear and casual outfits',
    icon: '<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>'
  },
  {
    name: 'Work',
    description: 'Professional attire for the workplace',
    icon: '<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>'
  },
  {
    name: 'Date Night',
    description: 'Romantic and elegant looks for special evenings',
    icon: '<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/></svg>'
  },
  {
    name: 'Weekend',
    description: 'Relaxed styles for leisure time',
    icon: '<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>'
  },
  {
    name: 'Events',
    description: 'Special occasion and formal event wear',
    icon: '<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>'
  }
];

async function seedDefaultCategories() {
  try {
    console.log('🌱 Starting to seed default categories...');
    
    // Get all companies
    const companies = await db.all('SELECT id, name FROM companies');
    
    if (companies.length === 0) {
      console.log('⚠️ No companies found. Please create a company first.');
      return;
    }
    
    for (const company of companies) {
      console.log(`\n📦 Processing company: ${company.name} (ID: ${company.id})`);
      
      for (const category of defaultCategories) {
        // Check if category already exists for this company
        const existing = await db.get(
          'SELECT id FROM categories WHERE company_id = ? AND name = ?',
          [company.id, category.name]
        );
        
        if (existing) {
          console.log(`  ⏭️  Category "${category.name}" already exists, skipping...`);
          continue;
        }
        
        // Create the category
        const result = await db.run(
          'INSERT INTO categories (name, description, icon, company_id) VALUES (?, ?, ?, ?)',
          [category.name, category.description, category.icon, company.id]
        );
        
        console.log(`  ✅ Created category: ${category.name} (ID: ${result.id})`);
      }
    }
    
    console.log('\n✨ Default categories seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding categories:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  seedDefaultCategories();
}

module.exports = seedDefaultCategories;
