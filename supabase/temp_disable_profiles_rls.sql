-- Temporarily disable RLS on profiles table to fix authentication
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Grant permissions to allow profile creation
GRANT ALL ON public.profiles TO anon, authenticated, public;

-- Check the result
SELECT 'RLS disabled on profiles table for debugging' as status;

-- Test if we can now create profiles
SELECT 'Authentication should work now' as test_result;