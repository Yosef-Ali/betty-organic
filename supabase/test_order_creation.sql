-- Test order creation script
-- Since auth.uid() returns null, we'll use your actual user ID

-- 1. First, let's see the table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'orders'
ORDER BY ordinal_position;

-- 2. Check what columns are NOT NULL
SELECT column_name
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'orders'
AND is_nullable = 'NO';

-- 3. Create a test order with your actual user ID (since RLS is disabled)
INSERT INTO orders (
    customer_profile_id,
    status,
    total_amount,
    type,
    display_id
) VALUES (
    '8909a357-b456-4532-8f60-6f6505be398f',  -- Your user ID from the debug output
    'pending',
    99.99,
    'sale',
    'SQL-TEST-' || EXTRACT(EPOCH FROM NOW())::TEXT
) RETURNING *;

-- 4. Alternative: Try with minimal required fields only
INSERT INTO orders (
    customer_profile_id,
    status,
    total_amount
) VALUES (
    '8909a357-b456-4532-8f60-6f6505be398f',
    'pending',
    123.45
) RETURNING *;