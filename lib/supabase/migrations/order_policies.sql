-- Drop existing policies
DROP POLICY IF EXISTS "customer_manage_orders" ON orders;
DROP POLICY IF EXISTS "customer_insert_orders" ON orders;
DROP POLICY IF EXISTS "customer_read_own_orders" ON orders;

-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to create orders
CREATE POLICY "customer_insert_orders" 
ON orders
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid()::text = customer_id);

-- Allow users to read their own orders
CREATE POLICY "customer_read_own_orders" 
ON orders
FOR SELECT 
TO authenticated
USING (auth.uid()::text = customer_id);

-- Allow users to manage their own orders
CREATE POLICY "customer_manage_orders" 
ON orders
FOR ALL 
TO authenticated
USING (auth.uid()::text = customer_id);

-- Order items policies
DROP POLICY IF EXISTS "customer_insert_order_items" ON order_items;
DROP POLICY IF EXISTS "customer_read_order_items" ON order_items;

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to create order items
CREATE POLICY "customer_insert_order_items" 
ON order_items
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id
    AND orders.customer_id = auth.uid()::text
  )
);

-- Allow users to read their own order items
CREATE POLICY "customer_read_order_items" 
ON order_items
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id
    AND orders.customer_id = auth.uid()::text
  )
);
