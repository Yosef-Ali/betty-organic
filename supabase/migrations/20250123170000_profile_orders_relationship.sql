-- Create profiles table with auth integration
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text,
  role text NOT NULL DEFAULT 'customer' CHECK (role IN ('admin', 'sales', 'customer')),
  status text DEFAULT 'active',
  avatar_url text,
  auth_provider varchar(50),
  email text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

-- Update orders table with profile relationship
ALTER TABLE public.orders
ADD COLUMN profile_id uuid NOT NULL,
ADD CONSTRAINT orders_profile_id_fkey
FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Drop legacy customers relationships
ALTER TABLE public.orders
DROP COLUMN IF EXISTS customer_id,
DROP CONSTRAINT IF EXISTS orders_customer_id_fkey;

-- Remove deprecated customers table
DROP TABLE IF EXISTS public.customers;
