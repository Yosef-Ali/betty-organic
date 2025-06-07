-- Force disable RLS and verify it's actually disabled
-- Run this to completely bypass RLS for testing

-- Disable RLS on orders table
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT 
    schemaname,
    tablename,
    rowsecurity as "RLS Enabled"
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'orders';

-- Test order creation directly in SQL (this should always work)
INSERT INTO orders (
    profile_id,
    customer_profile_id,
    status,
    total_amount,
    type,
    display_id
) VALUES (
    '8909a357-b456-4532-8f60-6f6505be398f',
    '8909a357-b456-4532-8f60-6f6505be398f',
    'pending',
    199.99,
    'sale',
    'SQL-' || (random() * 10000)::int
) RETURNING id, display_id, status, created_at;