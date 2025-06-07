-- Complete test order creation with all required fields
-- First disable RLS if not already done
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;

-- Check the table structure to see required fields
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'orders'
AND is_nullable = 'NO'
ORDER BY ordinal_position;

-- Create test order with all required fields
INSERT INTO orders (
    profile_id,
    customer_profile_id,
    status,
    total_amount,
    type,
    display_id
) VALUES (
    '8909a357-b456-4532-8f60-6f6505be398f',  -- profile_id (required)
    '8909a357-b456-4532-8f60-6f6505be398f',  -- customer_profile_id (required)
    'pending',
    99.99,
    'sale',
    'RT-' || LPAD((EXTRACT(EPOCH FROM NOW())::bigint % 10000)::text, 4, '0')
) RETURNING id, profile_id, customer_profile_id, status, total_amount, display_id, created_at;