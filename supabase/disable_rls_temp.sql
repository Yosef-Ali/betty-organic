-- Temporarily disable RLS for testing real-time system
-- This bypasses all row-level security policies

-- Disable RLS on orders table
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;

-- Disable RLS on order_items table (if needed)
ALTER TABLE public.order_items DISABLE ROW LEVEL SECURITY;

-- Check current RLS status
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('orders', 'order_items');

-- Create a test order to verify it works
INSERT INTO orders (
    customer_profile_id,
    status,
    total_amount,
    type,
    display_id
) VALUES (
    '8909a357-b456-4532-8f60-6f6505be398f',
    'pending',
    99.99,
    'sale',
    'RLS-TEST-' || EXTRACT(EPOCH FROM NOW())::TEXT
) RETURNING id, status, total_amount, display_id, created_at;