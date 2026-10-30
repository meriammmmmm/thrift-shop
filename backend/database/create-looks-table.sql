-- Create looks table
CREATE TABLE IF NOT EXISTS looks (
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  main_image VARCHAR(500) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- Create look_products junction table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS look_products (
  id SERIAL PRIMARY KEY,
  look_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (look_id) REFERENCES looks(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE(look_id, product_id)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_looks_company_id ON looks(company_id);
CREATE INDEX IF NOT EXISTS idx_looks_is_active ON looks(is_active);
CREATE INDEX IF NOT EXISTS idx_look_products_look_id ON look_products(look_id);
CREATE INDEX IF NOT EXISTS idx_look_products_product_id ON look_products(product_id);
