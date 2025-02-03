-- Clean up all existing policies

-- 1. Categories cleanup
DROP POLICY IF EXISTS "Allow all users to delete categories" ON categories;
DROP POLICY IF EXISTS "Allow all users to insert categories" ON categories;
DROP POLICY IF EXISTS "Allow all users to select categories" ON categories;
DROP POLICY IF EXISTS "Allow all users to update categories" ON categories;
DROP POLICY IF EXISTS "public_read_categories" ON categories;

-- 2. Knowledge base cleanup
DROP POLICY IF EXISTS "Allow all users to delete from knowledge_base" ON knowledge_base;
DROP POLICY IF EXISTS "Allow all users to insert into knowledge_base" ON knowledge_base;
DROP POLICY IF EXISTS "Allow all users to select from knowledge_base" ON knowledge_base;
DROP POLICY IF EXISTS "Allow all users to update knowledge_base" ON knowledge_base;
DROP POLICY IF EXISTS "Allow authenticated users to delete from knowledge_base" ON knowledge_base;
DROP POLICY IF EXISTS "Allow authenticated users to insert into knowledge_base" ON knowledge_base;
DROP POLICY IF EXISTS "Allow authenticated users to select from knowledge_base" ON knowledge_base;
DROP POLICY IF EXISTS "Allow authenticated users to update knowledge_base" ON knowledge_base;
DROP POLICY IF EXISTS "Authenticated users can read their own entries" ON knowledge_base;
DROP POLICY IF EXISTS "Users can delete their own entries" ON knowledge_base;
DROP POLICY IF EXISTS "Users can insert their own entries" ON knowledge_base;
DROP POLICY IF EXISTS "Users can view their own entries" ON knowledge_base;
DROP POLICY IF EXISTS "public_read_knowledge" ON knowledge_base;
DROP POLICY IF EXISTS "auth_write_knowledge" ON knowledge_base;

-- 3. Orders cleanup
DROP POLICY IF EXISTS "Users can create orders" ON orders;
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
DROP POLICY IF EXISTS "users_manage_own_orders" ON orders;

-- 4. Products cleanup (keep this simple)
DROP POLICY IF EXISTS "public_read_products" ON products;

-- 5. Profiles cleanup
DROP POLICY IF EXISTS "Admin full access profiles" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "users_read_own_profile" ON profiles;

-- Now create clean policies

-- 1. Products (public read access - this is what we need most)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_products" ON products FOR SELECT USING (true);

-- 2. Categories (public read access)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_categories" ON categories FOR SELECT USING (true);

-- 3. Knowledge base (public read, authenticated write)
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_knowledge" ON knowledge_base FOR SELECT USING (true);
CREATE POLICY "auth_write_knowledge" ON knowledge_base
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 4. Orders (customer access only)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "customer_manage_orders" ON orders
FOR ALL USING (auth.uid() = customer_profile_id::uuid);

-- 5. Profiles policies are managed in profiles_rls_policies.sql
-- Keeping RLS enabled but removing conflicting policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

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
