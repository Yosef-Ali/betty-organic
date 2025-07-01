-- Fix the order with NULL customer_profile_id
-- This is causing foreign key constraint violations

-- First, let's see what this order looks like
SELECT id, profile_id, customer_profile_id, status, created_at
FROM orders 
WHERE customer_profile_id IS NULL;

-- Fix by setting customer_profile_id to equal profile_id for orders where it's NULL
UPDATE orders 
SET customer_profile_id = profile_id 
WHERE customer_profile_id IS NULL;

-- Verify the fix
SELECT 'Orders with NULL customer_profile_id after fix' as check_type, count(*) as count
FROM orders 
WHERE customer_profile_id IS NULL;

-- Check that all orders now have valid profile references
SELECT 'Orders with missing profiles after fix' as check_type, count(*) as count
FROM orders o
WHERE NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = o.profile_id)
   OR NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = o.customer_profile_id);

SELECT 'Fix completed successfully' as status;