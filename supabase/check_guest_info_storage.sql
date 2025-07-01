-- Check current orders table structure for guest info fields
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'orders' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check recent orders to see if we have any guest-related data
SELECT 
  id,
  display_id,
  status,
  type,
  total_amount,
  created_at,
  profile_id,
  customer_profile_id
FROM public.orders 
ORDER BY created_at DESC 
LIMIT 5;