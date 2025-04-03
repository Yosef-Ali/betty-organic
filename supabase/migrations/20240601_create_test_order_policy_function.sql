-- Create a function that can be called by any authenticated user to create the test order policy
CREATE OR REPLACE FUNCTION create_test_order_policy()
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only proceed if the user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

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
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error creating test order policy: %', SQLERRM;
    RETURN FALSE;
END;
$$;
