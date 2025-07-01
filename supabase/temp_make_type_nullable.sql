-- Temporarily make type column nullable for debugging
ALTER TABLE public.orders ALTER COLUMN type DROP NOT NULL;

-- Also make status nullable in case it has similar issues
ALTER TABLE public.orders ALTER COLUMN status DROP NOT NULL;

-- Check the updated schema
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'orders' AND table_schema = 'public' 
AND column_name IN ('type', 'status', 'profile_id')
ORDER BY column_name;

SELECT 'type and status columns are now nullable for debugging' as status;