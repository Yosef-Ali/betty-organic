-- Check for constraint issues that might be causing errors

-- Check current foreign key constraints on orders table
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
WHERE 
    tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'orders';

-- Check if profiles table exists and has required structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check current orders table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'orders' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check for any rows that might violate foreign key constraints
SELECT 'Orders with missing profiles' as check_type, count(*) as count
FROM orders o
WHERE NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = o.profile_id)
   OR NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = o.customer_profile_id);

-- Test basic queries
SELECT 'Product count' as table_name, count(*) as count FROM products;
SELECT 'Profile count' as table_name, count(*) as count FROM profiles;
SELECT 'Order count' as table_name, count(*) as count FROM orders;