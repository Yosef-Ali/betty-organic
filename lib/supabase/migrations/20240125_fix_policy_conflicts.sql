-- Drop conflicting policies for about and about_content
DROP POLICY IF EXISTS "Allow admin write access on about" ON about;
DROP POLICY IF EXISTS "Allow public read access on about" ON about;
DROP POLICY IF EXISTS "Admin access to about_content" ON about_content;
DROP POLICY IF EXISTS "admins can do everything" ON about_content;
DROP POLICY IF EXISTS "anyone can view active about" ON about_content;

-- Drop conflicting order_items policies
DROP POLICY IF EXISTS "Enable delete access for admin and sales" ON order_items;
DROP POLICY IF EXISTS "Enable insert access for admin and sales" ON order_items;
DROP POLICY IF EXISTS "Enable insert access for order items" ON order_items;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON order_items;
DROP POLICY IF EXISTS "Enable read access for order items" ON order_items;
DROP POLICY IF EXISTS "Enable update access for admin and sales" ON order_items;
DROP POLICY IF EXISTS "Users can insert own order items" ON order_items;
DROP POLICY IF EXISTS "Users can view own order items" ON order_items;

-- Drop conflicting orders policies
DROP POLICY IF EXISTS "Enable delete access for admin and sales" ON orders;
DROP POLICY IF EXISTS "Enable insert access for admin and sales" ON orders;
DROP POLICY IF EXISTS "Enable insert access for sales and admin" ON orders;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON orders;
DROP POLICY IF EXISTS "Enable update access for admin and sales" ON orders;
DROP POLICY IF EXISTS "Users can insert own orders" ON orders;
DROP POLICY IF EXISTS "Users can update own orders" ON orders;
DROP POLICY IF EXISTS "Users can view own orders" ON orders;

-- Drop conflicting products policies
DROP POLICY IF EXISTS "Allow admin delete products" ON products;
DROP POLICY IF EXISTS "Allow admin insert products" ON products;
DROP POLICY IF EXISTS "Allow admin update products" ON products;
DROP POLICY IF EXISTS "Allow public read access to products" ON products;
DROP POLICY IF EXISTS "Enable product updates for authenticated users" ON products;
DROP POLICY IF EXISTS "Enable read access to all users" ON products;

-- Create clean policies for about tables
ALTER TABLE about ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_about" ON about FOR SELECT USING (true);
CREATE POLICY "admin_manage_about" ON about FOR ALL USING (auth.role() = 'admin');

ALTER TABLE about_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_about_content" ON about_content FOR SELECT USING (true);
CREATE POLICY "admin_manage_about_content" ON about_content FOR ALL USING (auth.role() = 'admin');

-- Create clean policies for order_items
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "customer_view_own_items" ON order_items FOR SELECT
USING (EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id
    AND orders.customer_profile_id = auth.uid()::uuid
));

CREATE POLICY "admin_sales_manage_items" ON order_items FOR ALL
USING (auth.role() IN ('admin', 'sales'));

-- Create clean policies for orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "customer_view_own_orders" ON orders FOR SELECT
USING (customer_profile_id = auth.uid()::uuid);

CREATE POLICY "admin_sales_manage_orders" ON orders FOR ALL
USING (auth.role() IN ('admin', 'sales'));

-- Create clean policies for products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_products" ON products FOR SELECT USING (true);
CREATE POLICY "admin_manage_products" ON products FOR ALL
USING (auth.role() = 'admin');

-- Verify final policies
SELECT
    schemaname,
    tablename,
    policyname,
    roles,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
