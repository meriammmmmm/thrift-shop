-- Migration to add category_products table and missing columns
-- Run this directly in Railway's PostgreSQL console

-- Create category_products table
CREATE TABLE IF NOT EXISTS category_products (
  id SERIAL PRIMARY KEY,
  category_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE(category_id, product_id)
);

-- Add missing columns to products table (if they don't exist)
DO $$ 
BEGIN
  -- Add display_order column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'display_order'
  ) THEN
    ALTER TABLE products ADD COLUMN display_order INTEGER DEFAULT 0;
  END IF;

  -- Add reservation_status column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'reservation_status'
  ) THEN
    ALTER TABLE products ADD COLUMN reservation_status TEXT DEFAULT 'available';
  END IF;

  -- Add reserved_by_order_id column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'reserved_by_order_id'
  ) THEN
    ALTER TABLE products ADD COLUMN reserved_by_order_id INTEGER;
  END IF;
END $$;

-- Verify the table was created
SELECT 'category_products table exists' AS status 
FROM information_schema.tables 
WHERE table_name = 'category_products';

-- Show the structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'category_products'
ORDER BY ordinal_position;
