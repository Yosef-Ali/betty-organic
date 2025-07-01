-- Check all constraints on the orders table
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'orders' AND tc.table_schema = 'public';

-- Check if type has an enum constraint
SELECT 
    t.typname,
    e.enumlabel
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid 
WHERE t.typname LIKE '%order%' OR t.typname LIKE '%type%';

-- Check what values are currently in the type column to understand valid values
SELECT DISTINCT type, COUNT(*) as count 
FROM public.orders 
GROUP BY type;