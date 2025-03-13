-- 1. Check if system_counters table exists and its structure
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM
    information_schema.columns
WHERE
    table_name = 'system_counters'
ORDER BY
    ordinal_position;

-- 2. Check if display_id column exists in orders table
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM
    information_schema.columns
WHERE
    table_name = 'orders'
    AND column_name = 'display_id';

-- 3. Check if the functions exist
SELECT
    routine_name,
    routine_type,
    data_type as return_type
FROM
    information_schema.routines
WHERE
    routine_schema = 'public'
    AND routine_name IN ('get_and_increment_counter', 'reset_counter');

-- 4. Check if RLS policies are correctly set up
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM
    pg_policies
WHERE
    tablename = 'system_counters';

-- 5. Test counter function (This will create a test counter)
SELECT get_and_increment_counter('test_counter');
SELECT get_and_increment_counter('test_counter');
SELECT get_and_increment_counter('test_counter');

-- 6. View the test counter results
SELECT * FROM system_counters WHERE counter_key = 'test_counter';

-- 7. Check if any orders have display_ids
SELECT
    id,
    display_id,
    created_at,
    status
FROM
    orders
WHERE
    display_id IS NOT NULL
ORDER BY
    created_at DESC
LIMIT 5;

-- 8. Check permissions
SELECT
    grantee,
    privilege_type
FROM
    information_schema.role_routine_grants
WHERE
    routine_name IN ('get_and_increment_counter', 'reset_counter')
    AND routine_schema = 'public';
