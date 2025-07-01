-- Temporarily disable RLS on products table to test basic access
-- This is for debugging purposes only

-- Disable RLS on products table
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;

-- Remove all existing policies
DROP POLICY IF EXISTS "products_select_public" ON public.products;
DROP POLICY IF EXISTS "Enable read access to all users" ON public.products;

-- Grant direct permissions
GRANT SELECT ON public.products TO anon;
GRANT SELECT ON public.products TO authenticated;
GRANT SELECT ON public.products TO public;

-- Test if we can now access products
SELECT 'Products accessible after disabling RLS' as test_type, count(*) as count FROM products;

SELECT 'RLS disabled on products - test if app works now' as status;