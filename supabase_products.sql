-- ============================================================
--  Mery Rose — Products data for Supabase
--  Project: mery-rose-clothing
--
--  HOW TO USE:
--   1. Open your Supabase project  →  https://supabase.com/dashboard
--   2. In the left sidebar click  "SQL Editor"
--   3. Click "New query", paste this WHOLE file, and press "Run"
--   4. Then click "Table Editor" → you'll see a "products" table with 8 rows
--
--  This creates the table (if it doesn't exist) and loads your products.
--  Safe to re-run: it clears and reloads the 8 starter products each time.
-- ============================================================

create table if not exists public.products (
  id                   bigint primary key,
  name                 text not null,
  description          text,
  price                numeric,
  original_price       numeric,
  images               jsonb,
  brand                text,
  size                 text,
  category             text,
  condition            text,
  color                text,
  in_stock             integer default 1,
  material             text,
  measurements         jsonb,
  care_instructions    jsonb,
  tags                 jsonb,
  seller_name          text,
  seller_rating        numeric,
  seller_location      text,
  views                integer default 0,
  likes                integer default 0,
  company_id           bigint,
  reservation_status   text default 'available',
  reserved_by_order_id bigint,
  display_order         integer default 0,
  visible              integer default 1,
  created_at           timestamptz default now(),
  updated_at           timestamptz default now()
);

-- Reload the 8 starter products (clears existing rows with these ids first)
delete from public.products where id between 1 and 8;

insert into public.products
  (id, name, description, price, original_price, images, brand, size, category,
   condition, color, in_stock, material, measurements, care_instructions, tags,
   seller_name, seller_rating, seller_location, views, likes, company_id,
   reservation_status, display_order, visible, created_at, updated_at)
values
(1, 'Vintage Denim Jacket',
 'Classic blue denim jacket in excellent condition. This timeless piece features authentic vintage wash and classic fit. Perfect for layering and adding a casual touch to any outfit.',
 35, 89.99,
 '["https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=400&fit=crop","https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?w=400&h=400&fit=crop","https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=400&h=400&fit=crop"]'::jsonb,
 'Levi''s', 'M', 'Jackets', 'Excellent', 'Blue', 0, '100% Cotton Denim',
 '{"chest":"42\"","length":"24\"","sleeve":"25\""}'::jsonb,
 '["Machine wash cold","Tumble dry low","Do not bleach"]'::jsonb,
 '["vintage","classic","casual","layering","featured"]'::jsonb,
 'Sarah M.', 4.8, 'San Francisco, CA', 127, 23, 1, 'sold', 0, 1,
 '2026-02-18 13:44:49', '2026-02-18 13:44:49'),

(2, 'Floral Summer Dress',
 'Light and breezy floral pattern dress perfect for summer occasions. Features a flattering A-line silhouette and comfortable midi length.',
 25, 68,
 '["https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400&h=400&fit=crop","https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400&h=400&fit=crop"]'::jsonb,
 'Anthropologie', 'S', 'Dresses', 'Like New', 'Floral', 0, '100% Rayon',
 '{"chest":"34\"","waist":"28\"","length":"42\""}'::jsonb,
 '["Hand wash cold","Hang to dry","Iron on low heat"]'::jsonb,
 '["floral","summer","midi","feminine","featured"]'::jsonb,
 'Emma K.', 4.9, 'Austin, TX', 89, 31, 1, 'sold', 0, 1,
 '2026-02-18 13:44:49', '2026-02-18 13:44:49'),

(3, 'Leather Boots',
 'Genuine leather boots in excellent condition. Classic design with durable construction, perfect for both casual and semi-formal occasions.',
 45, 120,
 '["https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=400&h=400&fit=crop","https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop"]'::jsonb,
 'Dr. Martens', '9', 'Shoes', 'Good', 'Black', 1, 'Genuine Leather',
 null,
 '["Clean with leather cleaner","Condition regularly","Store in dry place"]'::jsonb,
 '["leather","boots","classic","durable"]'::jsonb,
 'Mike R.', 4.7, 'Portland, OR', 156, 18, 1, 'available', 0, 1,
 '2026-02-18 13:44:49', '2026-02-18 13:44:49'),

(4, 'Designer Handbag',
 'Authentic designer handbag in pristine condition. Timeless design with premium leather construction.',
 180, 450,
 '["https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop"]'::jsonb,
 'Coach', 'One Size', 'Accessories', 'Like New', 'Brown', 1, 'Genuine Leather',
 null,
 '["Clean with leather cleaner","Store in dust bag","Avoid water"]'::jsonb,
 '["designer","luxury","leather","investment","featured"]'::jsonb,
 'Victoria S.', 5, 'Beverly Hills, CA', 234, 67, 1, 'available', 0, 1,
 '2026-02-18 13:44:49', '2026-02-18 13:44:49'),

(5, 'Black Jeans',
 'Slim fit black jeans in excellent condition. Modern cut with comfortable stretch. Perfect for both casual and dressed-up looks.',
 28, 89,
 '["https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=400&fit=crop"]'::jsonb,
 'Madewell', '32', 'Jeans', 'Excellent', 'Black', 1, '98% Cotton, 2% Elastane',
 '{"waist":"32\"","length":"32\""}'::jsonb,
 '["Machine wash cold","Hang to dry","Iron inside out"]'::jsonb,
 '["black","slim fit","stretch","versatile"]'::jsonb,
 'Jordan L.', 4.8, 'Los Angeles, CA', 94, 27, 1, 'available', 0, 1,
 '2026-02-18 13:44:49', '2026-02-18 13:44:49'),

(6, 'Wool Sweater',
 'Cozy wool sweater perfect for winter. Soft knit with classic crew neck design. Excellent for layering or wearing alone.',
 30, 75,
 '["https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400&h=400&fit=crop"]'::jsonb,
 'J.Crew', 'L', 'Sweaters', 'Excellent', 'Gray', 1, '100% Merino Wool',
 '{"chest":"44\"","length":"26\"","sleeve":"26\""}'::jsonb,
 '["Dry clean only","Store folded","Use moth protection"]'::jsonb,
 '["wool","cozy","winter","classic","featured"]'::jsonb,
 'Lisa T.', 5, 'Boston, MA', 73, 15, 1, 'available', 0, 1,
 '2026-02-18 13:44:49', '2026-02-18 13:44:49'),

(7, 'Silk Blouse',
 'Elegant silk blouse with delicate button details. Perfect for professional settings or special occasions.',
 42, 95,
 '["https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400&h=400&fit=crop"]'::jsonb,
 'Equipment', 'M', 'Tops', 'Excellent', 'Cream', 1, '100% Silk',
 '{"chest":"38\"","length":"25\"","sleeve":"24\""}'::jsonb,
 '["Dry clean only","Iron on low heat","Store on hangers"]'::jsonb,
 '["silk","elegant","professional","featured"]'::jsonb,
 'Rachel D.', 4.9, 'New York, NY', 65, 19, 1, 'available', 0, 1,
 '2026-02-18 13:44:49', '2026-02-18 13:44:49'),

(8, 'Cashmere Scarf',
 'Luxurious cashmere scarf in a beautiful neutral tone. Incredibly soft and perfect for any season.',
 38, 85,
 '["https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=400&fit=crop"]'::jsonb,
 'Burberry', 'One Size', 'Accessories', 'Excellent', 'Beige', 1, '100% Cashmere',
 null,
 '["Dry clean only","Store flat","Avoid direct sunlight"]'::jsonb,
 '["cashmere","luxury","neutral","versatile"]'::jsonb,
 'Charlotte B.', 4.8, 'London, UK', 98, 28, 1, 'available', 0, 1,
 '2026-02-18 13:44:49', '2026-02-18 13:44:49');

-- Done. Check the result:
select id, name, brand, price, in_stock, reservation_status from public.products order by id;
