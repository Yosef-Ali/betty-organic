-- Force schema refresh by rebuilding RLS policies and clearing cache
-- This should be run after the main migration to ensure schema cache is updated

-- Disable and re-enable RLS to force schema refresh
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Recreate all policies to ensure they're using the correct column names
DROP POLICY IF EXISTS "orders_select" ON public.orders;
DROP POLICY IF EXISTS "orders_insert" ON public.orders;
DROP POLICY IF EXISTS "orders_update" ON public.orders;
DROP POLICY IF EXISTS "orders_delete" ON public.orders;
DROP POLICY IF EXISTS "service_role_orders_all" ON public.orders;

-- Recreate policies with new column names
CREATE POLICY "orders_select" ON public.orders
    FOR SELECT
    USING (
        auth.uid() = profile_id 
        OR auth.uid() = customer_profile_id
        OR EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'sales')
        )
        OR auth.role() = 'service_role'
    );

CREATE POLICY "orders_insert" ON public.orders
    FOR INSERT
    WITH CHECK (
        auth.uid() = profile_id 
        OR auth.uid() = customer_profile_id
        OR EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'sales')
        )
        OR auth.role() = 'service_role'
    );

CREATE POLICY "orders_update" ON public.orders
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'sales')
        )
        OR auth.role() = 'service_role'
    );

CREATE POLICY "orders_delete" ON public.orders
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
        OR auth.role() = 'service_role'
    );

-- Allow service role full access to orders
CREATE POLICY "service_role_orders_all" ON public.orders
    FOR ALL
    USING (auth.role() = 'service_role');

-- Force a schema refresh by dropping and recreating a dummy function
CREATE OR REPLACE FUNCTION refresh_schema_cache() 
RETURNS void 
LANGUAGE plpgsql 
AS $$
BEGIN
    -- This function forces PostgREST to refresh its schema cache
    PERFORM pg_notify('pgrst', 'reload schema');
END;
$$;

SELECT refresh_schema_cache();
DROP FUNCTION refresh_schema_cache();

-- Verify the schema by showing current columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'orders' AND table_schema = 'public'
ORDER BY ordinal_position;