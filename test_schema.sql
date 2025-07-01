-- Test script to verify schema and create a test order
-- Run this in Supabase SQL Editor to test if the schema is working

-- First, let's verify we can insert into the profiles table
INSERT INTO public.profiles (
    id,
    email,
    role,
    status,
    name,
    phone,
    address,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'test-guest@example.com',
    'customer',
    'active',
    'Test Guest',
    '0911234567',
    'Test Address',
    now(),
    now()
) RETURNING id;

-- Now let's try to create an order with the new schema
WITH test_profile AS (
    SELECT id FROM public.profiles 
    WHERE email = 'test-guest@example.com' 
    LIMIT 1
)
INSERT INTO public.orders (
    profile_id,
    customer_profile_id,
    status,
    type,
    total_amount,
    display_id,
    created_at,
    updated_at
) 
SELECT 
    tp.id,
    tp.id,
    'pending',
    'online',
    100.00,
    'TEST-ORDER-001',
    now(),
    now()
FROM test_profile tp
RETURNING *;

-- Clean up test data
DELETE FROM public.orders WHERE display_id = 'TEST-ORDER-001';
DELETE FROM public.profiles WHERE email = 'test-guest@example.com';