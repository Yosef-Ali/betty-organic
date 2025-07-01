-- Force complete schema cache refresh
-- This should clear all cached schema information

-- Drop and recreate the foreign key constraints to force cache refresh
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_profile_id_fkey;
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_customer_profile_id_fkey;

-- Recreate the constraints
ALTER TABLE public.orders 
ADD CONSTRAINT orders_profile_id_fkey 
FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.orders 
ADD CONSTRAINT orders_customer_profile_id_fkey 
FOREIGN KEY (customer_profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Force PostgREST to reload schema
NOTIFY pgrst, 'reload schema';

-- Also notify other potential listeners
NOTIFY ddl_command_end;

-- Create a temporary function to force schema reload
CREATE OR REPLACE FUNCTION force_schema_reload() 
RETURNS void 
LANGUAGE plpgsql 
AS $$
BEGIN
    -- Force a schema change by adding and removing a dummy column
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS temp_reload_column TEXT;
    ALTER TABLE public.orders DROP COLUMN IF EXISTS temp_reload_column;
    
    -- Notify PostgREST
    PERFORM pg_notify('pgrst', 'reload schema');
END;
$$;

-- Execute the function
SELECT force_schema_reload();

-- Drop the function
DROP FUNCTION force_schema_reload();

-- Verify current schema
SELECT 'Schema refresh completed' as status;

-- Show current orders table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'orders' AND table_schema = 'public'
ORDER BY ordinal_position;