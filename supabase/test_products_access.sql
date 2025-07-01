-- Test if we can access products directly from the database
-- This will help diagnose if the issue is RLS policies or something else

-- Test basic product access
SELECT 'Basic product query' as test_type, count(*) as count FROM products;

-- Test product access with specific columns (matching the app query)
SELECT 
  id,
  name,
  description,
  price,
  stock,
  imageUrl,
  category,
  active,
  unit,
  totalsales,
  createdat,
  updatedat,
  created_by
FROM products 
WHERE active = true 
ORDER BY createdat DESC 
LIMIT 5;

-- Check RLS status on products table
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'products';

-- Check current policies on products table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'products';

-- Test if we can access as anon role
SET ROLE anon;
SELECT 'Products accessible as anon' as test_type, count(*) as count FROM products;
RESET ROLE;

-- Test if we can access as authenticated role  
SET ROLE authenticated;
SELECT 'Products accessible as authenticated' as test_type, count(*) as count FROM products;
RESET ROLE;