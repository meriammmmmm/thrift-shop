// Seed data for in-memory database
module.exports = async function seedDatabase(db) {
  try {
    console.log('🌱 Seeding database with initial data...');

    // Check if data already exists
    const existingCompany = await db.get('SELECT id FROM companies WHERE id = 1');
    if (existingCompany) {
      console.log('✅ Database already seeded');
      return;
    }

    // Create default company
    await db.run(`
      INSERT INTO companies (id, name, description, email, status, logo)
      VALUES (1, 'Pearl Box', 'Vintage treasures and unique finds', 'info@pearlbox.com', 'active', '')
    `);

    // Create some sample products
    const sampleProducts = [
      {
        name: 'Vintage Leather Jacket',
        description: 'Classic brown leather jacket in excellent condition',
        price: 89.99,
        original_price: 150.00,
        images: JSON.stringify(['https://images.unsplash.com/photo-1551028719-00167b16eac5']),
        brand: 'Vintage',
        size: 'M',
        category: 'Outerwear',
        condition: 'Excellent',
        color: 'Brown',
        company_id: 1
      },
      {
        name: 'Retro Sunglasses',
        description: 'Classic aviator style sunglasses',
        price: 29.99,
        original_price: 60.00,
        images: JSON.stringify(['https://images.unsplash.com/photo-1572635196237-14b3f281503f']),
        brand: 'Retro',
        size: 'One Size',
        category: 'Accessories',
        condition: 'Good',
        color: 'Gold',
        company_id: 1
      },
      {
        name: 'Vintage Denim Jeans',
        description: 'High-waisted vintage denim jeans',
        price: 45.00,
        original_price: 80.00,
        images: JSON.stringify(['https://images.unsplash.com/photo-1542272604-787c3835535d']),
        brand: 'Levi\'s',
        size: 'L',
        category: 'Bottoms',
        condition: 'Very Good',
        color: 'Blue',
        company_id: 1
      }
    ];

    for (const product of sampleProducts) {
      await db.run(`
        INSERT INTO products (name, description, price, original_price, images, brand, size, category, condition, color, company_id, in_stock)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
      `, [
        product.name,
        product.description,
        product.price,
        product.original_price,
        product.images,
        product.brand,
        product.size,
        product.category,
        product.condition,
        product.color,
        product.company_id
      ]);
    }

    console.log('✅ Database seeded successfully with sample data');
  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
  }
};
