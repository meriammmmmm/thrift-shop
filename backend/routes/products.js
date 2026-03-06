const express = require('express');
const db = require('../database/db');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all products with filtering
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      brand,
      search,
      sortBy = 'newest',
      minPrice,
      maxPrice,
      companyId
    } = req.query;

    const offset = (page - 1) * limit;
    // Show all products including sold out ones
    let whereClause = 'WHERE 1=1';
    let params = [];

    // Filter by company if specified
    if (companyId) {
      whereClause += ' AND p.company_id = ?';
      params.push(parseInt(companyId));
    }

    // Build where clause
    if (category && category !== 'All') {
      whereClause += ' AND p.category = ?';
      params.push(category);
    }

    if (brand && brand !== 'All') {
      whereClause += ' AND p.brand = ?';
      params.push(brand);
    }

    if (search) {
      whereClause += ' AND (p.name LIKE ? OR p.brand LIKE ? OR p.description LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (minPrice) {
      whereClause += ' AND p.price >= ?';
      params.push(parseFloat(minPrice));
    }

    if (maxPrice) {
      whereClause += ' AND p.price <= ?';
      params.push(parseFloat(maxPrice));
    }

    // Build order clause
    let orderClause = 'ORDER BY p.created_at DESC';
    switch (sortBy) {
      case 'price-low':
        orderClause = 'ORDER BY p.price ASC';
        break;
      case 'price-high':
        orderClause = 'ORDER BY p.price DESC';
        break;
      case 'brand':
        orderClause = 'ORDER BY p.brand ASC';
        break;
      case 'popular':
        orderClause = 'ORDER BY p.likes DESC';
        break;
    }

    // Get products with company information
    const products = await db.all(
      `SELECT p.*, c.name as company_name, c.description as company_description 
       FROM products p 
       LEFT JOIN companies c ON p.company_id = c.id 
       ${whereClause} ${orderClause} LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    // Get total count
    const totalResult = await db.get(
      `SELECT COUNT(*) as total FROM products p ${whereClause}`,
      params
    );

    // Parse JSON fields and add company info
    const parsedProducts = products.map(product => ({
      ...product,
      price: parseFloat(product.price),
      original_price: product.original_price ? parseFloat(product.original_price) : null,
      seller_rating: product.seller_rating ? parseFloat(product.seller_rating) : null,
      images: product.images ? JSON.parse(product.images) : [],
      measurements: product.measurements ? JSON.parse(product.measurements) : null,
      care_instructions: product.care_instructions ? JSON.parse(product.care_instructions) : [],
      tags: product.tags ? JSON.parse(product.tags) : [],
      reservation_status: product.reservation_status || 'available',
      reserved_by_order_id: product.reserved_by_order_id || null,
      company: product.company_name ? {
        id: product.company_id,
        name: product.company_name,
        description: product.company_description
      } : null
    }));

    res.json({
      products: parsedProducts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalResult.total,
        pages: Math.ceil(totalResult.total / limit)
      }
    });
  } catch (error) {
    console.error('Products fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single product
router.get('/:id', async (req, res) => {
  try {
    const product = await db.get(`
      SELECT p.*, c.name as company_name, c.description as company_description 
      FROM products p 
      LEFT JOIN companies c ON p.company_id = c.id 
      WHERE p.id = ?
    `, [req.params.id]);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Update views
    await db.run('UPDATE products SET views = views + 1 WHERE id = ?', [req.params.id]);

    // Parse JSON fields and add company info
    const parsedProduct = {
      ...product,
      images: product.images ? JSON.parse(product.images) : [],
      measurements: product.measurements ? JSON.parse(product.measurements) : null,
      care_instructions: product.care_instructions ? JSON.parse(product.care_instructions) : [],
      tags: product.tags ? JSON.parse(product.tags) : [],
      reservation_status: product.reservation_status || 'available',
      reserved_by_order_id: product.reserved_by_order_id || null,
      company: product.company_name ? {
        id: product.company_id,
        name: product.company_name,
        description: product.company_description
      } : null
    };

    res.json(parsedProduct);
  } catch (error) {
    console.error('Product fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create product (Admin only)
router.post('/', requireAdmin, async (req, res) => {
  try {
    const adminUser = req.user;
    const companyId = adminUser.admin_company_id;

    if (!companyId) {
      return res.status(403).json({ error: 'Admin not associated with any company' });
    }

    const {
      name, description, price, original_price, images, brand, size,
      category, condition, color, material, measurements, care_instructions,
      tags, seller_name, seller_rating, seller_location
    } = req.body;

    if (!name || !price || !brand || !category) {
      return res.status(400).json({ error: 'Name, price, brand, and category are required' });
    }

    // Validate images array size (allow base64 for AI-generated images)
    if (images && Array.isArray(images)) {
      // Check if images field is too large (increased limit for base64 images)
      const imagesStr = JSON.stringify(images);
      const sizeInKB = (imagesStr.length / 1024).toFixed(2);
      console.log(`📦 Images data size: ${sizeInKB} KB (${images.length} images)`);
      
      if (imagesStr.length > 5000000) { // 5MB limit for base64 images (allows ~10-12 compressed images)
        return res.status(400).json({ 
          error: `Images data too large (${sizeInKB} KB). Maximum 5MB allowed.` 
        });
      }
    }

    const result = await db.run(`
      INSERT INTO products (
        name, description, price, original_price, images, brand, size,
        category, condition, color, material, measurements, care_instructions,
        tags, seller_name, seller_rating, seller_location, company_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      name, description, price, original_price,
      JSON.stringify(images || []), brand, size, category, condition, color,
      material, JSON.stringify(measurements || {}),
      JSON.stringify(care_instructions || []), JSON.stringify(tags || []),
      seller_name, seller_rating, seller_location, companyId
    ]);

    console.log('Product created with ID:', result.id);
    const product = await db.get('SELECT * FROM products WHERE id = ?', [result.id]);
    res.status(201).json(product);
  } catch (error) {
    console.error('Product creation error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// Update product (Admin only)
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const adminUser = req.user;
    const companyId = adminUser.admin_company_id;

    if (!companyId) {
      return res.status(403).json({ error: 'Admin not associated with any company' });
    }

    const { id } = req.params;
    const updates = req.body;

    // Log the update request for debugging
    console.log(`PUT /api/products/${id} - Update request from company ${companyId}`);
    console.log('Update fields:', Object.keys(updates));

    // Check if product belongs to admin's company
    const existingProduct = await db.get('SELECT company_id FROM products WHERE id = ?', [id]);
    if (!existingProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }
    if (existingProduct.company_id !== companyId) {
      return res.status(403).json({ error: 'You can only update products from your company' });
    }

    // Validate images array size (allow base64 for AI-generated images)
    if (updates.images) {
      if (Array.isArray(updates.images)) {
        // Check if images field is too large (increased limit for base64 images)
        const imagesStr = JSON.stringify(updates.images);
        const sizeInKB = (imagesStr.length / 1024).toFixed(2);
        console.log(`📦 Images data size: ${sizeInKB} KB (${updates.images.length} images)`);
        
        if (imagesStr.length > 5000000) { // 5MB limit for base64 images (allows ~10-12 compressed images)
          console.error(`Images field too large: ${sizeInKB} KB`);
          return res.status(400).json({ 
            error: `Images data too large (${sizeInKB} KB). Maximum 5MB allowed.` 
          });
        }
      }
      updates.images = JSON.stringify(updates.images);
    }

    // Convert arrays/objects to JSON strings
    if (updates.measurements) updates.measurements = JSON.stringify(updates.measurements);
    if (updates.care_instructions) updates.care_instructions = JSON.stringify(updates.care_instructions);
    if (updates.tags) updates.tags = JSON.stringify(updates.tags);

    // Remove any fields that shouldn't be updated or don't exist in products table
    delete updates.id;
    delete updates.created_at;
    delete updates.updated_at;
    delete updates.company_id;
    delete updates.company_name;
    delete updates.company_description;
    delete updates.company;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);

    await db.run(
      `UPDATE products SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [...values, id]
    );

    const product = await db.get('SELECT * FROM products WHERE id = ?', [id]);
    res.json(product);
  } catch (error) {
    console.error('Product update error:', error);
    console.error('Error details:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Delete product (Admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const adminUser = req.user;
    const companyId = adminUser.admin_company_id;

    if (!companyId) {
      return res.status(403).json({ error: 'Admin not associated with any company' });
    }

    // Check if product belongs to admin's company
    const existingProduct = await db.get('SELECT company_id FROM products WHERE id = ?', [req.params.id]);
    if (!existingProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }
    if (existingProduct.company_id !== companyId) {
      return res.status(403).json({ error: 'You can only delete products from your company' });
    }

    const result = await db.run('DELETE FROM products WHERE id = ?', [req.params.id]);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Product deletion error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get categories
router.get('/meta/categories', async (req, res) => {
  try {
    const categories = await db.all('SELECT DISTINCT category FROM products WHERE in_stock = TRUE');
    res.json(categories.map(c => c.category));
  } catch (error) {
    console.error('Categories fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get brands
router.get('/meta/brands', async (req, res) => {
  try {
    const brands = await db.all('SELECT DISTINCT brand FROM products WHERE in_stock = TRUE');
    res.json(brands.map(b => b.brand));
  } catch (error) {
    console.error('Brands fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get products for admin (company-specific)
router.get('/admin/products', requireAdmin, async (req, res) => {
  try {
    const adminUser = req.user;
    const companyId = adminUser.admin_company_id;

    if (!companyId) {
      return res.status(403).json({ error: 'Admin not associated with any company' });
    }

    const {
      page = 1,
      limit = 12,
      category,
      brand,
      search,
      sortBy = 'newest'
    } = req.query;

    const offset = (page - 1) * limit;
    let whereClause = 'WHERE company_id = ?';
    let params = [companyId];

    // Build where clause
    if (category && category !== 'All') {
      whereClause += ' AND category = ?';
      params.push(category);
    }

    if (brand && brand !== 'All') {
      whereClause += ' AND brand = ?';
      params.push(brand);
    }

    if (search) {
      whereClause += ' AND (name LIKE ? OR brand LIKE ? OR description LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // Build order clause
    let orderClause = 'ORDER BY created_at DESC';
    switch (sortBy) {
      case 'price-low':
        orderClause = 'ORDER BY price ASC';
        break;
      case 'price-high':
        orderClause = 'ORDER BY price DESC';
        break;
      case 'brand':
        orderClause = 'ORDER BY brand ASC';
        break;
      case 'popular':
        orderClause = 'ORDER BY likes DESC';
        break;
    }

    // Get products
    const products = await db.all(
      `SELECT * FROM products ${whereClause} ${orderClause} LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    // Get total count
    const totalResult = await db.get(
      `SELECT COUNT(*) as total FROM products ${whereClause}`,
      params
    );

    // Parse JSON fields
    const parsedProducts = products.map(product => ({
      ...product,
      images: product.images ? JSON.parse(product.images) : [],
      measurements: product.measurements ? JSON.parse(product.measurements) : null,
      care_instructions: product.care_instructions ? JSON.parse(product.care_instructions) : [],
      tags: product.tags ? JSON.parse(product.tags) : []
    }));

    res.json({
      products: parsedProducts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalResult.total,
        pages: Math.ceil(totalResult.total / limit)
      }
    });
  } catch (error) {
    console.error('Admin products fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update product display order (Admin only)
router.put('/admin/reorder', requireAdmin, async (req, res) => {
  try {
    const adminUser = req.user;
    const companyId = adminUser.admin_company_id;

    if (!companyId) {
      return res.status(403).json({ error: 'Admin not associated with any company' });
    }

    const { productOrders } = req.body; // Array of { id, display_order }

    if (!Array.isArray(productOrders)) {
      return res.status(400).json({ error: 'productOrders must be an array' });
    }

    // Update each product's display order
    for (const item of productOrders) {
      const { id, display_order } = item;
      
      // Verify product belongs to admin's company
      const product = await db.get('SELECT company_id FROM products WHERE id = ?', [id]);
      if (!product || product.company_id !== companyId) {
        continue; // Skip products that don't belong to this company
      }

      // Try to update display_order, ignore if column doesn't exist yet
      try {
        await db.run(
          'UPDATE products SET display_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [display_order, id]
        );
      } catch (err) {
        // Column doesn't exist yet, skip
        console.log('display_order column not yet available');
      }
    }

    res.json({ message: 'Product order updated successfully' });
  } catch (error) {
    console.error('Product reorder error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get products for a specific company storefront
router.get('/company/:companyId', async (req, res) => {
  try {
    console.log('📥 Company products request:', req.params.companyId);
    
    const { companyId } = req.params;
    const {
      page = 1,
      limit = 12,
      category,
      brand,
      search,
      sortBy = 'newest',
      minPrice,
      maxPrice
    } = req.query;

    console.log('🔍 Fetching company...');
    // First, get company information
    const company = await db.get('SELECT * FROM companies WHERE id = ?', [companyId]);
    console.log('Company result:', company);
    
    if (!company) {
      console.log('❌ Company not found or inactive');
      // Return a default company structure instead of 404
      return res.json({
        company: {
          id: parseInt(companyId),
          name: 'Mery Rose',
          description: 'Elegant vintage fashion and timeless pieces',
          logo: '/images/mery-rose-logo.png',
          website: 'https://meryrose.com',
          email: 'contact@meryrose.com',
          country: 'US',
          show_testimonials: true
        },
        products: [],
        pagination: {
          page: 1,
          limit: 12,
          total: 0,
          pages: 0
        }
      });
    }

    console.log('✅ Company found:', company.name);

    const offset = (page - 1) * limit;
    // Show all products including sold out ones
    let whereClause = 'WHERE p.company_id = ?';
    let params = [parseInt(companyId)];

    // Build where clause
    if (category && category !== 'All') {
      whereClause += ' AND p.category = ?';
      params.push(category);
    }

    if (brand && brand !== 'All') {
      whereClause += ' AND p.brand = ?';
      params.push(brand);
    }

    if (search) {
      whereClause += ' AND (p.name LIKE ? OR p.brand LIKE ? OR p.description LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (minPrice) {
      whereClause += ' AND p.price >= ?';
      params.push(parseFloat(minPrice));
    }

    if (maxPrice) {
      whereClause += ' AND p.price <= ?';
      params.push(parseFloat(maxPrice));
    }

    // Build order clause
    let orderClause = 'ORDER BY p.created_at DESC';
    switch (sortBy) {
      case 'price-low':
        orderClause = 'ORDER BY p.price ASC';
        break;
      case 'price-high':
        orderClause = 'ORDER BY p.price DESC';
        break;
      case 'brand':
        orderClause = 'ORDER BY p.brand ASC';
        break;
      case 'popular':
        orderClause = 'ORDER BY p.likes DESC';
        break;
    }

    // Get products with company information
    const products = await db.all(
      `SELECT p.*, c.name as company_name, c.description as company_description 
       FROM products p 
       LEFT JOIN companies c ON p.company_id = c.id 
       ${whereClause} ${orderClause} LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    // Get total count
    const totalResult = await db.get(
      `SELECT COUNT(*) as total FROM products p ${whereClause}`,
      params
    );

    // Parse JSON fields and add company info
    const parsedProducts = products.map(product => ({
      ...product,
      price: parseFloat(product.price),
      original_price: product.original_price ? parseFloat(product.original_price) : null,
      seller_rating: product.seller_rating ? parseFloat(product.seller_rating) : null,
      images: product.images ? JSON.parse(product.images) : [],
      measurements: product.measurements ? JSON.parse(product.measurements) : null,
      care_instructions: product.care_instructions ? JSON.parse(product.care_instructions) : [],
      tags: product.tags ? JSON.parse(product.tags) : [],
      reservation_status: product.reservation_status || 'available',
      reserved_by_order_id: product.reserved_by_order_id || null,
      company: {
        id: product.company_id,
        name: product.company_name,
        description: product.company_description
      }
    }));

    res.json({
      company: {
        id: company.id,
        name: company.name,
        description: company.description,
        logo: company.logo,
        website: company.website,
        email: company.email,
        country: company.country,
        show_testimonials: company.show_testimonials
      },
      products: parsedProducts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalResult.total,
        pages: Math.ceil(totalResult.total / limit)
      }
    });
  } catch (error) {
    console.error('❌ Company products fetch error:', error);
    console.error('Error stack:', error.stack);
    console.error('Company ID:', req.params.companyId);
    
    // Return default company data with error info
    res.json({
      company: {
        id: parseInt(req.params.companyId),
        name: 'Mery Rose',
        description: 'Elegant vintage fashion and timeless pieces',
        logo: '/images/mery-rose-logo.png',
        website: 'https://meryrose.com',
        email: 'contact@meryrose.com',
        country: 'US',
        show_testimonials: true
      },
      products: [],
      pagination: {
        page: 1,
        limit: 12,
        total: 0,
        pages: 0
      },
      error: process.env.NODE_ENV === 'development' ? error.message : 'Database error'
    });
  }
});

module.exports = router;