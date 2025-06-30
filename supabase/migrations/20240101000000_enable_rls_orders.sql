-- Enable RLS on orders table
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Verify RLS is enabled (optional comment for documentation)
-- The following policies should already exist:
-- - orders_delete
-- - orders_insert
-- - orders_select
-- - orders_update
