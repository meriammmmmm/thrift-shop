-- Add company ID 2 to match environment variables
-- Run this on your production database

INSERT INTO companies (id, name, description, email, status, logo, show_testimonials, country, website)
VALUES (2, 'Mery Rose', 'Elegant vintage fashion and timeless pieces', 'contact@meryrose.com', 'active', '/images/mery-rose-logo.png', 1, 'US', 'https://meryrose.com')
ON CONFLICT (id) DO NOTHING;

-- Update existing products to use company_id 2 if needed
-- UPDATE products SET company_id = 2 WHERE company_id = 1;
