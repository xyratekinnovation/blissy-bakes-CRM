-- Seed Data for Blissy Bakes

-- 1. Create a default owner user (PIN: 1234 -> Hash properly using bcrypt)
-- NOTE: In production, use the signup flow or Python backend to create users with proper hashes.
-- This is just for structural testing. 
-- For now, we will assume the auth/login endpoint verifies against a known hash. 
-- '1234' is a placeholder. Real app users should be created via Python backend to get correct bcrypt hash.
INSERT INTO app_users (full_name, phone_number, pin_hash, role)
VALUES 
('Admin Owner', '9999999999', '$2a$10$YourHashedPinHere...', 'owner');

-- 2. Products
INSERT INTO products (name, sku, price, category, image_url)
VALUES 
('Chocolate Truffle Cake', 'CAKE-001', 550.00, 'Cakes', 'https://images.unsplash.com/photo-1578985545062-69928b1d9587'),
('Red Velvet Cupcake', 'CUP-001', 80.00, 'Cupcakes', 'https://images.unsplash.com/photo-1614707267537-b85aaf00c4b7'),
('Sourdough Bread', 'BRD-001', 120.00, 'Breads', 'https://images.unsplash.com/photo-1585478564381-032f5732ac6e'),
('Butter Croissant', 'PAS-001', 95.00, 'Pastries', 'https://images.unsplash.com/photo-1555507036-ab1f4038808a');

-- 3. Inventory for Products
INSERT INTO inventory (product_id, stock_quantity, low_stock_threshold)
SELECT id, 50, 5 FROM products;

-- 4. Sample Customers
INSERT INTO customers (full_name, phone_number, notes)
VALUES
('John Doe', '9876543210', 'Loves chocolate'),
('Jane Smith', '8765432109', 'Allergic to nuts');

-- 5. Sample Orders
-- (Ideally create via function to sync inventory, but raw insert for seeding)
-- Inserting logic skipped in seed to avoid complexity with UUIDs.
