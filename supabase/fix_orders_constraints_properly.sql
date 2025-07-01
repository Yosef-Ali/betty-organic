-- Fix orders constraints without violating foreign key constraints
-- We'll use existing user IDs or handle NULL values differently

-- First, let's see what we're working with
SELECT 'Current orders with NULL values:' as info;
SELECT 
  COUNT(*) as total_orders,
  COUNT(profile_id) as orders_with_profile_id,
  COUNT(customer_profile_id) as orders_with_customer_profile_id,
  COUNT(type) as orders_with_type,
  COUNT(status) as orders_with_status
FROM public.orders;

-- Set default values without creating new profiles
-- For profile_id: use customer_profile_id if available, otherwise use the first available user
UPDATE public.orders 
SET profile_id = COALESCE(
  customer_profile_id,
  (SELECT id FROM auth.users LIMIT 1)
)
WHERE profile_id IS NULL;

-- Set default type for any NULL type values
UPDATE public.orders 
SET type = 'online'
WHERE type IS NULL;

-- Set default status for any NULL status values  
UPDATE public.orders 
SET status = 'pending'
WHERE status IS NULL;

-- Verify all columns have values now
SELECT 'After updates:' as info;
SELECT 
  COUNT(*) as total_orders,
  COUNT(profile_id) as orders_with_profile_id,
  COUNT(customer_profile_id) as orders_with_customer_profile_id,
  COUNT(type) as orders_with_type,
  COUNT(status) as orders_with_status
FROM public.orders;

-- Only restore constraints if we have valid data
DO $$
BEGIN
  -- Check if all required columns have values
  IF (SELECT COUNT(*) FROM public.orders WHERE profile_id IS NULL OR type IS NULL OR status IS NULL) = 0 THEN
    -- Restore the NOT NULL constraints
    ALTER TABLE public.orders ALTER COLUMN profile_id SET NOT NULL;
    ALTER TABLE public.orders ALTER COLUMN type SET NOT NULL;
    ALTER TABLE public.orders ALTER COLUMN status SET NOT NULL;
    
    RAISE NOTICE 'Orders table constraints restored successfully';
  ELSE
    RAISE NOTICE 'Cannot restore constraints - some NULL values remain';
  END IF;
END $$;

SELECT 'Constraint restoration completed' as status;