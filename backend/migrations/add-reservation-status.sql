-- Migration: Add reservation status to products table
-- This allows tracking if products are available, reserved, or sold

-- Add reservation_status column
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS reservation_status TEXT DEFAULT 'available';

-- Add reserved_by_order_id column
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS reserved_by_order_id INTEGER DEFAULT NULL;

-- Update existing products to have 'available' status if in_stock is true
UPDATE products 
SET reservation_status = 'available' 
WHERE in_stock = true AND (reservation_status IS NULL OR reservation_status = '');

-- Update existing products to have 'sold' status if in_stock is false
UPDATE products 
SET reservation_status = 'sold' 
WHERE in_stock = false AND (reservation_status IS NULL OR reservation_status = '');

-- Fix products from cancelled/refunded orders
UPDATE products 
SET in_stock = true,
    reservation_status = 'available',
    reserved_by_order_id = NULL
WHERE id IN (
  SELECT DISTINCT oi.product_id
  FROM orders o
  JOIN order_items oi ON o.id = oi.order_id
  WHERE o.status IN ('CANCELLED', 'REFUNDED')
    AND oi.product_id IS NOT NULL
);

-- Fix products from CONFIRMED orders (not yet delivered)
UPDATE products 
SET in_stock = true,
    reservation_status = 'available',
    reserved_by_order_id = NULL
WHERE id IN (
  SELECT DISTINCT oi.product_id
  FROM orders o
  JOIN order_items oi ON o.id = oi.order_id
  WHERE o.status IN ('CONFIRMED', 'PENDING', 'PROCESSING', 'SHIPPED')
    AND oi.product_id IS NOT NULL
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_products_reservation_status ON products(reservation_status);
CREATE INDEX IF NOT EXISTS idx_products_reserved_by_order ON products(reserved_by_order_id);
