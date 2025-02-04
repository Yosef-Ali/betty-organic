-- Add phone column to profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone TEXT;

-- Create index for phone column
CREATE INDEX IF NOT EXISTS profiles_phone_idx ON public.profiles(phone);
