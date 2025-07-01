-- Restore NOT NULL constraints on orders table now that we've fixed the data fetching
-- First, ensure we have valid data in the columns

-- Update any NULL profile_id values to use a default guest profile
UPDATE public.orders 
SET profile_id = (
  SELECT id FROM public.profiles 
  WHERE email LIKE 'guest%@guest.bettyorganic.com' 
  LIMIT 1
)
WHERE profile_id IS NULL;

-- If no guest profile exists, create one
INSERT INTO public.profiles (id, email, name, role, status)
SELECT 
  gen_random_uuid(),
  'guest-default@guest.bettyorganic.com',
  'Guest Customer',
  'customer',
  'active'
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE email LIKE 'guest%@guest.bettyorganic.com'
);

-- Update any remaining NULL profile_id values
UPDATE public.orders 
SET profile_id = (
  SELECT id FROM public.profiles 
  WHERE email = 'guest-default@guest.bettyorganic.com'
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

-- Now restore the NOT NULL constraints
ALTER TABLE public.orders ALTER COLUMN profile_id SET NOT NULL;
ALTER TABLE public.orders ALTER COLUMN type SET NOT NULL;
ALTER TABLE public.orders ALTER COLUMN status SET NOT NULL;

SELECT 'Orders table constraints restored' as status;