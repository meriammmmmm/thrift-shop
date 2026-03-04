-- Fix inventory for cancelled/refunded orders
-- This SQL script makes products available again if their orders were cancelled

-- Step 1: Show cancelled orders with sold-out products
SELECT 
  o.id as order_id,
  o.status,
  oi.product_id,
  p.name as product_name,
  p.in_stock
FROM orders o
JOIN order_items oi ON o.id = oi.order_id
LEFT JOIN products p ON oi.product_id = p.id
WHERE o.status IN ('CANCELLED', 'REFUNDED')
  AND p.in_stock = 0;

-- Step 2: Fix products from cancelled/refunded orders
UPDATE products 
SET in_stock = 1
WHERE id IN (
  SELECT DISTINCT oi.product_id
  FROM orders o
  JOIN order_items oi ON o.id = oi.order_id
  WHERE o.status IN ('CANCELLED', 'REFUNDED')
    AND oi.product_id IS NOT NULL
);

-- Step 3: Fix products from CONFIRMED orders (payment not confirmed yet)
UPDATE products 
SET in_stock = 1
WHERE id IN (
  SELECT DISTINCT oi.product_id
  FROM orders o
  JOIN order_items oi ON o.id = oi.order_id
  WHERE o.status = 'CONFIRMED'
    AND oi.product_id IS NOT NULL
);

-- Step 4: Verify the fix
SELECT 
  'Fixed' as status,
  COUNT(*) as count
FROM products
WHERE in_stock = 1;
