-- DANGER: This script disables Row Level Security for orders tables
-- Only use temporarily for troubleshooting, then re-enable RLS

-- Disable RLS for orders and order_items tables
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items DISABLE ROW LEVEL SECURITY;

-- Grant full access to authenticated users
GRANT ALL ON public.orders TO authenticated;
GRANT ALL ON public.orders TO anon;
GRANT ALL ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO anon;

-- Create a dummy function to check if RLS is disabled
CREATE OR REPLACE FUNCTION check_rls_status()
RETURNS TABLE (table_name text, rls_enabled boolean) AS $$
BEGIN
  RETURN QUERY
  SELECT
    tables.tablename::text,
    tables.rowsecurity AS rls_enabled
  FROM
    pg_tables AS tables
  WHERE
    tables.schemaname = 'public'
    AND tables.tablename IN ('orders', 'order_items');
END;
$$ LANGUAGE plpgsql;

-- To re-enable RLS later, run:
/*
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
SELECT * FROM check_rls_status();
*/
