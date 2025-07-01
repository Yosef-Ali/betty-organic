-- Emergency fix for RLS policies that are blocking basic functionality
-- Run this immediately to restore access to products and other essential functions

-- Fix products table policies - ensure public read access
DROP POLICY IF EXISTS "products_select_public" ON public.products;
CREATE POLICY "products_select_public" ON public.products
    FOR SELECT
    TO PUBLIC
    USING (true);

-- Ensure products table allows anon access
DROP POLICY IF EXISTS "Enable read access to all users" ON public.products;
CREATE POLICY "Enable read access to all users" ON public.products
    FOR SELECT
    TO PUBLIC
    USING (true);

-- Fix profiles policies to be less restrictive
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
CREATE POLICY "profiles_select" ON public.profiles
    FOR SELECT
    USING (
        -- Allow users to see their own profile
        id = auth.uid()
        -- Allow admin/sales to see all profiles
        OR EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'sales')
        )
        -- Always allow service role
        OR auth.role() = 'service_role'
        -- Allow anon access for guest orders (temporary)
        OR auth.role() = 'anon'
    );

-- Fix profiles insert policy to allow guest creation
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
CREATE POLICY "profiles_insert" ON public.profiles
    FOR INSERT
    WITH CHECK (
        -- Allow authenticated users to create their own profile
        id = auth.uid()
        -- Allow admin/sales to create profiles
        OR EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'sales')
        )
        -- Always allow service role
        OR auth.role() = 'service_role'
        -- Allow anon to create guest profiles
        OR auth.role() = 'anon'
    );

-- Fix orders policies to be less restrictive
DROP POLICY IF EXISTS "orders_select" ON public.orders;
CREATE POLICY "orders_select" ON public.orders
    FOR SELECT
    USING (
        -- User can see their own orders
        auth.uid() = profile_id 
        OR auth.uid() = customer_profile_id
        -- Admin/sales can see all orders
        OR EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'sales')
        )
        -- Service role can see all
        OR auth.role() = 'service_role'
        -- Allow anon access for guest order operations
        OR auth.role() = 'anon'
    );

-- Fix orders insert policy
DROP POLICY IF EXISTS "orders_insert" ON public.orders;
CREATE POLICY "orders_insert" ON public.orders
    FOR INSERT
    WITH CHECK (
        -- User can create orders for themselves
        auth.uid() = profile_id 
        OR auth.uid() = customer_profile_id
        -- Admin/sales can create orders
        OR EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'sales')
        )
        -- Service role can create orders
        OR auth.role() = 'service_role'
        -- Allow anon to create guest orders
        OR auth.role() = 'anon'
    );

-- Fix order_items policies
DROP POLICY IF EXISTS "order_items_select" ON public.order_items;
CREATE POLICY "order_items_select" ON public.order_items
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE orders.id = order_items.order_id 
            AND (
                orders.profile_id = auth.uid() 
                OR orders.customer_profile_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM profiles 
                    WHERE profiles.id = auth.uid() 
                    AND profiles.role IN ('admin', 'sales')
                )
            )
        )
        OR auth.role() = 'service_role'
        OR auth.role() = 'anon'
    );

DROP POLICY IF EXISTS "order_items_insert" ON public.order_items;
CREATE POLICY "order_items_insert" ON public.order_items
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE orders.id = order_items.order_id 
            AND (
                orders.profile_id = auth.uid() 
                OR orders.customer_profile_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM profiles 
                    WHERE profiles.id = auth.uid() 
                    AND profiles.role IN ('admin', 'sales')
                )
            )
        )
        OR auth.role() = 'service_role'
        OR auth.role() = 'anon'
    );

-- Ensure proper permissions are granted
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.products TO anon, authenticated;
GRANT ALL ON public.orders TO anon, authenticated;
GRANT ALL ON public.order_items TO anon, authenticated;
GRANT ALL ON public.profiles TO anon, authenticated;

-- Grant sequence permissions if needed
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';

SELECT 'RLS policies fixed - basic functionality should be restored' as status;