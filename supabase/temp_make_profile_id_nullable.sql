-- Temporarily make profile_id nullable to debug the issue
-- This will help us identify if the problem is with the constraint or the value

ALTER TABLE public.orders ALTER COLUMN profile_id DROP NOT NULL;

-- Check the updated schema
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'orders' AND table_schema = 'public' AND column_name = 'profile_id';

SELECT 'profile_id is now nullable for debugging' as status;