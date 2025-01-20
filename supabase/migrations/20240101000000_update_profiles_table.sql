-- Drop existing constraints
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_status_check;

-- Add new columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS status TEXT CHECK (status IN ('active', 'inactive')),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL;

-- Modify existing columns
ALTER TABLE public.profiles
  ALTER COLUMN role SET NOT NULL,
  ALTER COLUMN role TYPE TEXT;

-- Add check constraint
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check CHECK (role IN ('admin', 'sales', 'customer'));

-- Create indexes
CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles(role);
CREATE INDEX IF NOT EXISTS profiles_status_idx ON public.profiles(status);

-- Update existing rows
UPDATE public.profiles
SET
  role = 'customer',
  status = 'active',
  updated_at = NOW()
WHERE
  role IS NULL OR
  status IS NULL OR
  updated_at IS NULL;
