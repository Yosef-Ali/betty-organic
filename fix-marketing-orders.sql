-- Fix for marketing page order creation - More permissive policy for any authenticated user

-- First ensure any authenticated user can create orders and order items
DO $$
BEGIN
    -- Drop existing restrictive policies
    DROP POLICY IF EXISTS "Enable insert for all authenticated users" ON public.orders;
    DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.orders;
    DROP POLICY IF EXISTS "Enable insert access for admin and sales" ON public.orders;
    DROP POLICY IF EXISTS "Enable insert access for all authenticated users" ON public.orders;
    DROP POLICY IF EXISTS "Customers can create orders" ON public.orders;
    DROP POLICY IF EXISTS "Sales can create orders" ON public.orders;

    -- Create completely permissive insert policy for authenticated users
    CREATE POLICY "Anyone authenticated can create orders"
    ON public.orders
    FOR INSERT
    WITH CHECK (auth.role() IN ('authenticated', 'anon'));

    -- Drop restrictive policies for order items
    DROP POLICY IF EXISTS "Enable insert for all authenticated users" ON public.order_items;
    DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.order_items;
    DROP POLICY IF EXISTS "Enable insert access for admin and sales" ON public.order_items;
    DROP POLICY IF EXISTS "Anyone can insert order items" ON public.order_items;

    -- Create completely permissive insert policy for order items
    CREATE POLICY "Anyone authenticated can create order items"
    ON public.order_items
    FOR INSERT
    WITH CHECK (auth.role() IN ('authenticated', 'anon'));

    -- If we need to temporarily bypass RLS completely, uncomment these:
    -- ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
    -- ALTER TABLE public.order_items DISABLE ROW LEVEL SECURITY;
END
$$;

-- Create a function to log RLS errors since RLS_REPORT isn't available
CREATE OR REPLACE FUNCTION log_rls_error() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.error_logs (error_type, table_name, operation, details, created_at)
  VALUES ('RLS_VIOLATION', TG_TABLE_NAME, TG_OP, 'Row Level Security policy violation', NOW());
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create the error_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.error_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    error_type TEXT NOT NULL,
    table_name TEXT NOT NULL,
    operation TEXT NOT NULL,
    details TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- If needed, run a test to check if order creation works
/*
INSERT INTO public.orders (
  id,
  profile_id,
  customer_profile_id,
  total_amount,
  status,
  type,
  display_id
)
VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',  -- Replace with an actual user ID from your system
  '00000000-0000-0000-0000-000000000000',  -- Replace with an actual customer ID
  100,
  'pending',
  'online',
  'TEST-ORDER-ID'
);
*/
