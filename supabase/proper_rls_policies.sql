-- Create proper RLS policies that won't break the application
-- This ensures security while maintaining functionality

-- Re-enable RLS on products table
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Create proper products policies
-- 1. Public read access for all users (including anonymous)
CREATE POLICY "products_public_read" ON public.products
    FOR SELECT
    TO PUBLIC
    USING (true);

-- 2. Admin and sales can insert products
CREATE POLICY "products_admin_insert" ON public.products
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'sales')
        )
    );

-- 3. Admin and sales can update products
CREATE POLICY "products_admin_update" ON public.products
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'sales')
        )
    );

-- 4. Only admin can delete products
CREATE POLICY "products_admin_delete" ON public.products
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Ensure proper permissions are still granted
GRANT SELECT ON public.products TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.products TO authenticated;

-- Test the policies
SELECT 'Proper RLS policies created for products' as status;

-- Test public read access
SELECT 'Products accessible with new policies' as test_type, count(*) as count FROM products;