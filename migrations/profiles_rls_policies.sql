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
    -- Admin can read all profiles
    (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'))
    OR
    -- Sales can read own profile and customer profiles
    (auth.uid() IN (SELECT id FROM profiles WHERE role = 'sales')
     AND (
       auth.uid() = id
       OR role = 'customer'
     )
    )
    OR
    -- Customers can read their own profile
    (auth.uid() = id)
  );

CREATE POLICY "Enable insert for authenticated users" ON profiles
  FOR INSERT
  WITH CHECK (
    -- Only admin and sales can create new profiles
    auth.uid() IN (
      SELECT id FROM profiles
      WHERE role IN ('admin', 'sales')
    )
    -- And only allow creating customer profiles
    AND role = 'customer'
  );

CREATE POLICY "Enable update for users based on role" ON profiles
  FOR UPDATE
  USING (
    -- Admin can update any profile
    (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'))
    OR
    -- Sales can update customer profiles
    (auth.uid() IN (SELECT id FROM profiles WHERE role = 'sales')
     AND role = 'customer'
    )
    OR
    -- Users can update their own profiles
    (auth.uid() = id)
  );

CREATE POLICY "Enable delete for admin" ON profiles
  FOR DELETE
  USING (
    -- Only admin can delete profiles
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
    -- And only allow deleting customer profiles
    AND role = 'customer'
  );
