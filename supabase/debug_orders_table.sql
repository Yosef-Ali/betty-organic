-- Test script to check orders table structure and create a test order
-- Run this in Supabase SQL Editor

-- 1. Check table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'orders'
ORDER BY ordinal_position;

-- 2. Check current user
SELECT auth.uid() as current_user_id, 
       auth.email() as current_user_email,
       auth.role() as current_role;

-- 3. Check if user exists in profiles
SELECT id, role, status, email 
FROM profiles 
WHERE id = auth.uid();

-- 4. Try to insert a test order manually
INSERT INTO orders (
    profile_id,
    customer_profile_id,
    status,
    total_amount,
    type,
    display_id
) VALUES (
    auth.uid(),
    auth.uid(),
    'pending',
    99.99,
    'sale',
    'SQL-TEST-' || EXTRACT(EPOCH FROM NOW())::TEXT
) RETURNING *;

-- 5. Check recently created orders
SELECT * FROM orders 
WHERE profile_id = auth.uid() 
OR customer_profile_id = auth.uid()
ORDER BY created_at DESC 
LIMIT 5;