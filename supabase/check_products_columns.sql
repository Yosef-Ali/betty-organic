-- Check actual column names in products table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'products' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Test a simple query with actual column names
SELECT id, name, price, active FROM products LIMIT 1;