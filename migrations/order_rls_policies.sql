-- Remove existing RLS policies for orders table
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON orders;
DROP POLICY IF EXISTS "Enable insert access for admin and sales" ON orders;
DROP POLICY IF EXISTS "Enable update access for admin and sales" ON orders;
DROP POLICY IF EXISTS "Enable delete access for admin and sales" ON orders;

-- Enable RLS on orders table
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Create policies for orders table
CREATE POLICY "Enable read access for authenticated users" ON orders
  FOR SELECT
  USING (
    -- Admin can read all orders
    (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'))
    OR
    -- Sales can read orders they created
    (auth.uid() IN (SELECT id FROM profiles WHERE role = 'sales') AND profile_id = auth.uid())
    OR
    -- Customers can read their own orders
    (auth.uid() IN (SELECT id FROM profiles WHERE role = 'customer') AND customer_profile_id = auth.uid()::uuid)
  );

CREATE POLICY "Enable insert access for admin and sales" ON orders
  FOR INSERT
  WITH CHECK (
    -- Only admin and sales can create orders
    auth.uid() IN (
      SELECT id FROM profiles
      WHERE role IN ('admin', 'sales')
    )
  );

CREATE POLICY "Enable update access for admin and sales" ON orders
  FOR UPDATE
  USING (
    -- Admin can update any order
    (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'))
    OR
    -- Sales can update orders they created or customer orders
    (auth.uid() IN (SELECT id FROM profiles WHERE role = 'sales'))
  )
  );

CREATE POLICY "Enable delete access for admin and sales" ON orders
  FOR DELETE
  USING (
    -- Admin can delete any order
    (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'))
    OR
    -- Sales can delete orders they created or customer orders
    (auth.uid() IN (SELECT id FROM profiles WHERE role = 'sales'))
  );
    -- Admin can delete any order
    (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'))
    OR
    -- Sales can only delete orders they created
    (auth.uid() IN (SELECT id FROM profiles WHERE role = 'sales') AND profile_id = auth.uid())
  );

-- Remove existing RLS policies for order_items table
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON order_items;
DROP POLICY IF EXISTS "Enable insert access for admin and sales" ON order_items;
DROP POLICY IF EXISTS "Enable update access for admin and sales" ON order_items;
DROP POLICY IF EXISTS "Enable delete access for admin and sales" ON order_items;

-- Enable RLS on order_items table
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Create policies for order_items table
CREATE POLICY "Enable read access for authenticated users" ON order_items
  FOR SELECT
  USING (
    -- Admin can read all order items
    (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'))
    OR
    -- Sales can read order items for orders they created
    (auth.uid() IN (SELECT id FROM profiles WHERE role = 'sales') AND order_id IN (SELECT id FROM orders WHERE profile_id = auth.uid()))
    OR
    -- Customers can read their own order items
    (auth.uid() IN (SELECT id FROM profiles WHERE role = 'customer') AND order_id IN (SELECT id FROM orders WHERE customer_profile_id = auth.uid()))
  );

CREATE POLICY "Enable insert access for admin and sales" ON order_items
  FOR INSERT
  WITH CHECK (
    -- Only admin and sales can create order items
    auth.uid() IN (
      SELECT id FROM profiles
      WHERE role IN ('admin', 'sales')
    )
  );

CREATE POLICY "Enable update access for admin and sales" ON order_items
  FOR UPDATE
  USING (
    -- Admin can update any order items
    (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'))
    OR
    -- Sales can only update order items for orders they created
    (auth.uid() IN (SELECT id FROM profiles WHERE role = 'sales') AND order_id IN (SELECT id FROM orders WHERE profile_id = auth.uid()))
  );

CREATE POLICY "Enable delete access for admin and sales" ON order_items
  FOR DELETE
  USING (
    -- Admin can delete any order items
    (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'))
    OR
    -- Sales can only delete order items for orders they created
    (auth.uid() IN (SELECT id FROM profiles WHERE role = 'sales') AND order_id IN (SELECT id FROM orders WHERE profile_id = auth.uid()))
  );
