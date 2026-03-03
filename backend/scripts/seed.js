const bcrypt = require('bcryptjs');
const db = require('../database/db');

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');

    // Demo users removed - create users through the admin panel or signup

    // Sample products
    const products = [
      {
        name: "Vintage Denim Jacket",
        description: "Classic blue denim jacket in excellent condition. This timeless piece features authentic vintage wash and classic fit. Perfect for layering and adding a casual touch to any outfit.",
        price: 35.00,
        original_price: 89.99,
        images: JSON.stringify([
          "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=400&fit=crop",
          "https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?w=400&h=400&fit=crop",
          "https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=400&h=400&fit=crop"
        ]),
        brand: "Levi's",
        size: "M",
        category: "Jackets",
        condition: "Excellent",
        color: "Blue",
        material: "100% Cotton Denim",
        measurements: JSON.stringify({
          chest: "42\"",
          length: "24\"",
          sleeve: "25\""
        }),
        care_instructions: JSON.stringify(["Machine wash cold", "Tumble dry low", "Do not bleach"]),
        tags: JSON.stringify(["vintage", "classic", "casual", "layering", "featured"]),
        seller_name: "Sarah M.",
        seller_rating: 4.8,
        seller_location: "San Francisco, CA",
        views: 127,
        likes: 23
      },
      {
        name: "Floral Summer Dress",
        description: "Light and breezy floral pattern dress perfect for summer occasions. Features a flattering A-line silhouette and comfortable midi length.",
        price: 25.00,
        original_price: 68.00,
        images: JSON.stringify([
          "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400&h=400&fit=crop",
          "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400&h=400&fit=crop"
        ]),
        brand: "Anthropologie",
        size: "S",
        category: "Dresses",
        condition: "Like New",
        color: "Floral",
        material: "100% Rayon",
        measurements: JSON.stringify({
          chest: "34\"",
          waist: "28\"",
          length: "42\""
        }),
        care_instructions: JSON.stringify(["Hand wash cold", "Hang to dry", "Iron on low heat"]),
        tags: JSON.stringify(["floral", "summer", "midi", "feminine", "featured"]),
        seller_name: "Emma K.",
        seller_rating: 4.9,
        seller_location: "Austin, TX",
        views: 89,
        likes: 31
      },
      {
        name: "Leather Boots",
        description: "Genuine leather boots in excellent condition. Classic design with durable construction, perfect for both casual and semi-formal occasions.",
        price: 45.00,
        original_price: 120.00,
        images: JSON.stringify([
          "https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=400&h=400&fit=crop",
          "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop"
        ]),
        brand: "Dr. Martens",
        size: "9",
        category: "Shoes",
        condition: "Good",
        color: "Black",
        material: "Genuine Leather",
        care_instructions: JSON.stringify(["Clean with leather cleaner", "Condition regularly", "Store in dry place"]),
        tags: JSON.stringify(["leather", "boots", "classic", "durable"]),
        seller_name: "Mike R.",
        seller_rating: 4.7,
        seller_location: "Portland, OR",
        views: 156,
        likes: 18
      },
      {
        name: "Designer Handbag",
        description: "Authentic designer handbag in pristine condition. Timeless design with premium leather construction.",
        price: 180.00,
        original_price: 450.00,
        images: JSON.stringify([
          "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop"
        ]),
        brand: "Coach",
        size: "One Size",
        category: "Accessories",
        condition: "Like New",
        color: "Brown",
        material: "Genuine Leather",
        care_instructions: JSON.stringify(["Clean with leather cleaner", "Store in dust bag", "Avoid water"]),
        tags: JSON.stringify(["designer", "luxury", "leather", "investment", "featured"]),
        seller_name: "Victoria S.",
        seller_rating: 5.0,
        seller_location: "Beverly Hills, CA",
        views: 234,
        likes: 67
      },
      {
        name: "Black Jeans",
        description: "Slim fit black jeans in excellent condition. Modern cut with comfortable stretch. Perfect for both casual and dressed-up looks.",
        price: 28.00,
        original_price: 89.00,
        images: JSON.stringify([
          "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=400&fit=crop"
        ]),
        brand: "Madewell",
        size: "32",
        category: "Jeans",
        condition: "Excellent",
        color: "Black",
        material: "98% Cotton, 2% Elastane",
        measurements: JSON.stringify({
          waist: "32\"",
          length: "32\""
        }),
        care_instructions: JSON.stringify(["Machine wash cold", "Hang to dry", "Iron inside out"]),
        tags: JSON.stringify(["black", "slim fit", "stretch", "versatile"]),
        seller_name: "Jordan L.",
        seller_rating: 4.8,
        seller_location: "Los Angeles, CA",
        views: 94,
        likes: 27
      },
      {
        name: "Wool Sweater",
        description: "Cozy wool sweater perfect for winter. Soft knit with classic crew neck design. Excellent for layering or wearing alone.",
        price: 30.00,
        original_price: 75.00,
        images: JSON.stringify([
          "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400&h=400&fit=crop"
        ]),
        brand: "J.Crew",
        size: "L",
        category: "Sweaters",
        condition: "Excellent",
        color: "Gray",
        material: "100% Merino Wool",
        measurements: JSON.stringify({
          chest: "44\"",
          length: "26\"",
          sleeve: "26\""
        }),
        care_instructions: JSON.stringify(["Dry clean only", "Store folded", "Use moth protection"]),
        tags: JSON.stringify(["wool", "cozy", "winter", "classic", "featured"]),
        seller_name: "Lisa T.",
        seller_rating: 5.0,
        seller_location: "Boston, MA",
        views: 73,
        likes: 15
      },
      {
        name: "Silk Blouse",
        description: "Elegant silk blouse with delicate button details. Perfect for professional settings or special occasions.",
        price: 42.00,
        original_price: 95.00,
        images: JSON.stringify([
          "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400&h=400&fit=crop"
        ]),
        brand: "Equipment",
        size: "M",
        category: "Tops",
        condition: "Excellent",
        color: "Cream",
        material: "100% Silk",
        measurements: JSON.stringify({
          chest: "38\"",
          length: "25\"",
          sleeve: "24\""
        }),
        care_instructions: JSON.stringify(["Dry clean only", "Iron on low heat", "Store on hangers"]),
        tags: JSON.stringify(["silk", "elegant", "professional", "featured"]),
        seller_name: "Rachel D.",
        seller_rating: 4.9,
        seller_location: "New York, NY",
        views: 65,
        likes: 19
      },
      {
        name: "Cashmere Scarf",
        description: "Luxurious cashmere scarf in a beautiful neutral tone. Incredibly soft and perfect for any season.",
        price: 38.00,
        original_price: 85.00,
        images: JSON.stringify([
          "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=400&fit=crop"
        ]),
        brand: "Burberry",
        size: "One Size",
        category: "Accessories",
        condition: "Excellent",
        color: "Beige",
        material: "100% Cashmere",
        care_instructions: JSON.stringify(["Dry clean only", "Store flat", "Avoid direct sunlight"]),
        tags: JSON.stringify(["cashmere", "luxury", "neutral", "versatile"]),
        seller_name: "Charlotte B.",
        seller_rating: 4.8,
        seller_location: "London, UK",
        views: 98,
        likes: 28
      }
    ];

    // Insert products
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      await db.run(`
        INSERT OR REPLACE INTO products (
          id, name, description, price, original_price, images, brand, size,
          category, condition, color, material, measurements, care_instructions,
          tags, seller_name, seller_rating, seller_location, views, likes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        i + 1, product.name, product.description, product.price, product.original_price,
        product.images, product.brand, product.size, product.category, product.condition,
        product.color, product.material, product.measurements, product.care_instructions,
        product.tags, product.seller_name, product.seller_rating, product.seller_location,
        product.views, product.likes
      ]);
    }

    // Create sample order
    await db.run(`
      INSERT OR REPLACE INTO orders (
        id, user_id, status, subtotal, tax, shipping, total, payment_method,
        shipping_address, billing_address
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      1, 2, 'DELIVERED', 60.00, 4.80, 0.00, 64.80, 'Credit Card',
      JSON.stringify({
        name: 'Test User',
        address: '123 Main St',
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94102'
      }),
      JSON.stringify({
        name: 'Test User',
        address: '123 Main St',
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94102'
      })
    ]);

    // Create order items
    await db.run(`
      INSERT OR REPLACE INTO order_items (id, order_id, product_id, quantity, price)
      VALUES (1, 1, 1, 1, 35.00)
    `);
    await db.run(`
      INSERT OR REPLACE INTO order_items (id, order_id, product_id, quantity, price)
      VALUES (2, 1, 2, 1, 25.00)
    `);

    // Add to wishlist
    await db.run(`
      INSERT OR REPLACE INTO wishlist (id, user_id, product_id)
      VALUES (1, 2, 4)
    `);

    console.log('✅ Database seeded successfully!');
    console.log('📦 Products created:', products.length);
    console.log('🛒 Sample order created');

  } catch (error) {
    console.error('❌ Seeding error:', error);
  }
}

// Run seeding
seedDatabase();