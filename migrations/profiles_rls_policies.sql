-- Remove existing RLS policies for profiles table
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on role" ON profiles;
DROP POLICY IF EXISTS "Enable delete for admin" ON profiles;

-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles table
CREATE POLICY "Enable read access for authenticated users" ON profiles
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
  );

-- Allow users to create their own profile
CREATE POLICY "Enable insert for users" ON profiles
  FOR INSERT
  WITH CHECK (
    auth.uid() = id
  );

-- Allow users to update their own profile, admins can update any profile
CREATE POLICY "Enable update for users based on role" ON profiles
  FOR UPDATE
  USING (
    -- Users can always update their own profile
    auth.uid() = id
    OR
    -- Admin check using a subquery to avoid recursion
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
    OR
    -- Sales can update customer profiles
    (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role = 'sales'
      )
      AND role = 'customer'
    )
  );

-- Only admin can delete profiles
CREATE POLICY "Enable delete for admin" ON profiles
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
    AND role = 'customer'
  );

-- Create a policy specifically for profile creation during authentication
CREATE POLICY "Enable self-insert during auth" ON profiles
  FOR INSERT
  WITH CHECK (
    auth.uid() = id
    AND role = 'customer'
  );
