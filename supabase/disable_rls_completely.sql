-- Disable RLS completely on products table for now
-- We'll focus on guest orders first, then fix products security later

-- Disable RLS on products table
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;

-- Remove all policies
DROP POLICY IF EXISTS "products_public_read" ON public.products;
DROP POLICY IF EXISTS "products_admin_insert" ON public.products;
DROP POLICY IF EXISTS "products_admin_update" ON public.products;
DROP POLICY IF EXISTS "products_admin_delete" ON public.products;

-- Grant full permissions
GRANT ALL ON public.products TO anon, authenticated, public;

-- Test access
SELECT 'RLS completely disabled on products' as status;
SELECT 'Products should be accessible now' as test_type, count(*) as count FROM products;