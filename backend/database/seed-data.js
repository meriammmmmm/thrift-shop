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

    // Create default company with logo
    await db.run(`
      INSERT INTO companies (id, name, description, email, status, logo, show_testimonials, country, website)
      VALUES (1, 'Mery Rose', 'Elegant vintage fashion and timeless pieces', 'contact@meryrose.com', 'active', '/images/mery-rose-logo.png', 1, 'US', 'https://meryrose.com')
    `);

    // Create some sample products
    const sampleProducts = [
      {
        name: 'Vintage Chanel Tweed Jacket',
        description: 'Authentic vintage Chanel tweed jacket in classic black and white. Timeless elegance with gold-tone buttons.',
        price: 1299.99,
        original_price: 2500.00,
        images: JSON.stringify(['https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800']),
        brand: 'Chanel',
        size: 'M',
        category: 'Dresses',
        condition: 'Excellent',
        color: 'Black & White',
        company_id: 1
      },
      {
        name: 'Hermès Silk Scarf',
        description: 'Luxurious Hermès silk scarf with iconic print. Perfect condition, comes with original box.',
        price: 349.99,
        original_price: 450.00,
        images: JSON.stringify(['https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=800']),
        brand: 'Hermès',
        size: 'One Size',
        category: 'Accessories',
        condition: 'Excellent',
        color: 'Multi',
        company_id: 1
      },
      {
        name: 'Christian Louboutin Pumps',
        description: 'Classic black patent leather Louboutin pumps with signature red sole. Size 38.',
        price: 599.99,
        original_price: 795.00,
        images: JSON.stringify(['https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800']),
        brand: 'Christian Louboutin',
        size: '38',
        category: 'Shoes',
        condition: 'Very Good',
        color: 'Black',
        company_id: 1
      },
      {
        name: 'Gucci Marmont Bag',
        description: 'Pre-loved Gucci Marmont shoulder bag in soft matelassé leather with iconic GG hardware.',
        price: 1499.99,
        original_price: 2200.00,
        images: JSON.stringify(['https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800']),
        brand: 'Gucci',
        size: 'One Size',
        category: 'Bags',
        condition: 'Excellent',
        color: 'Black',
        company_id: 1
      },
      {
        name: 'Vintage Dior Silk Dress',
        description: 'Stunning vintage Christian Dior silk dress from the 1980s. Elegant silhouette in perfect condition.',
        price: 899.99,
        original_price: 1500.00,
        images: JSON.stringify(['https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800']),
        brand: 'Dior',
        size: 'S',
        category: 'Dresses',
        condition: 'Excellent',
        color: 'Navy',
        company_id: 1
      },
      {
        name: 'Burberry Trench Coat',
        description: 'Classic Burberry trench coat in signature beige with iconic check lining. Timeless piece.',
        price: 799.99,
        original_price: 1200.00,
        images: JSON.stringify(['https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=800']),
        brand: 'Burberry',
        size: 'M',
        category: 'Dresses',
        condition: 'Very Good',
        color: 'Beige',
        company_id: 1
      },
      {
        name: 'Prada Sunglasses',
        description: 'Elegant Prada cat-eye sunglasses with tortoiseshell frames. Comes with original case.',
        price: 249.99,
        original_price: 380.00,
        images: JSON.stringify(['https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800']),
        brand: 'Prada',
        size: 'One Size',
        category: 'Accessories',
        condition: 'Excellent',
        color: 'Tortoiseshell',
        company_id: 1
      },
      {
        name: 'Valentino Rockstud Heels',
        description: 'Iconic Valentino Rockstud pumps in nude patent leather. Signature pyramid studs.',
        price: 649.99,
        original_price: 995.00,
        images: JSON.stringify(['https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800']),
        brand: 'Valentino',
        size: '37',
        category: 'Shoes',
        condition: 'Very Good',
        color: 'Nude',
        company_id: 1
      },
      {
        name: 'Saint Laurent Leather Jacket',
        description: 'Classic YSL black leather biker jacket. Edgy yet elegant, perfect condition.',
        price: 1899.99,
        original_price: 3500.00,
        images: JSON.stringify(['https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800']),
        brand: 'Saint Laurent',
        size: 'S',
        category: 'Dresses',
        condition: 'Excellent',
        color: 'Black',
        company_id: 1
      },
      {
        name: 'Cartier Love Bracelet',
        description: 'Pre-owned Cartier Love bracelet in 18k yellow gold. Comes with certificate of authenticity.',
        price: 4999.99,
        original_price: 6800.00,
        images: JSON.stringify(['https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800']),
        brand: 'Cartier',
        size: 'One Size',
        category: 'Accessories',
        condition: 'Excellent',
        color: 'Gold',
        company_id: 1
      },
      {
        name: 'Fendi Baguette Bag',
        description: 'Iconic Fendi Baguette bag in brown leather with FF logo. A true collector\'s piece.',
        price: 1299.99,
        original_price: 2100.00,
        images: JSON.stringify(['https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800']),
        brand: 'Fendi',
        size: 'One Size',
        category: 'Bags',
        condition: 'Very Good',
        color: 'Brown',
        company_id: 1
      },
      {
        name: 'Versace Silk Blouse',
        description: 'Luxurious Versace silk blouse with baroque print. Bold and beautiful.',
        price: 449.99,
        original_price: 750.00,
        images: JSON.stringify(['https://images.unsplash.com/photo-1564859228273-274232fdb516?w=800']),
        brand: 'Versace',
        size: 'M',
        category: 'Tops',
        condition: 'Excellent',
        color: 'Multi',
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
