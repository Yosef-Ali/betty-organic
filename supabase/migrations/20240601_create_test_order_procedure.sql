-- Create a stored procedure to apply the test order policy
CREATE OR REPLACE FUNCTION apply_test_order_policy()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Drop existing policy if it exists
  DROP POLICY IF EXISTS "Enable test orders for authenticated users" ON orders;
  
  -- Create the new policy
  CREATE POLICY "Enable test orders for authenticated users" ON orders
    FOR INSERT
    WITH CHECK (
      -- Any authenticated user can create test orders
      auth.uid() IS NOT NULL
      AND type = 'test'
    );
  
  RETURN TRUE;
END;
$$;
