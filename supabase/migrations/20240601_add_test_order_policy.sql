-- Add a policy specifically for test orders
DROP POLICY IF EXISTS "Enable test orders for authenticated users" ON orders;

CREATE POLICY "Enable test orders for authenticated users" ON orders
  FOR INSERT
  WITH CHECK (
    -- Any authenticated user can create test orders
    auth.uid() IS NOT NULL
    AND type = 'test'
  );

-- Update the existing insert policy to exclude test orders
DROP POLICY IF EXISTS "Enable insert access for all authenticated users" ON orders;

CREATE POLICY "Enable insert access for all authenticated users" ON orders
  FOR INSERT
  WITH CHECK (
    -- Customers can only create orders for themselves
    (
      auth.uid() IN (SELECT id FROM profiles WHERE role = 'customer')
      AND customer_profile_id = auth.uid()
      AND profile_id = auth.uid()
      AND type != 'test'
    )
    OR
    -- Admin and sales can create orders for any customer
    (
      auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'sales'))
      AND profile_id = auth.uid()
      AND type != 'test'
    )
  );
