-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.orders;
DROP POLICY IF EXISTS "Enable select for users based on customer_profile_id" ON public.orders;
DROP POLICY IF EXISTS "Admin can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Sales can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Admin can modify all orders" ON public.orders;
DROP POLICY IF EXISTS "Sales can modify orders" ON public.orders;
DROP POLICY IF EXISTS "Sales can create orders" ON public.orders;
DROP POLICY IF EXISTS "Sales can view their orders" ON public.orders;
DROP POLICY IF EXISTS "Enable insert for order items" ON public.order_items;
DROP POLICY IF EXISTS "Enable select for order items" ON public.order_items;
DROP POLICY IF EXISTS "Admin can view all order items" ON public.order_items;
DROP POLICY IF EXISTS "Sales can view all order items" ON public.order_items;

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Policy for creating orders (allows both authenticated and guest users)
CREATE POLICY "Enable insert for all users"
ON public.orders
FOR INSERT
WITH CHECK (true);

-- Policy for viewing orders (users can only view their own orders)
CREATE POLICY "Enable select for users based on customer_profile_id"
ON public.orders
FOR SELECT
USING (customer_profile_id = auth.uid() OR customer_profile_id::text LIKE 'guest%');

-- Policy for admin users to view all orders
CREATE POLICY "Admin can view all orders"
ON public.orders
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Policy for sales users to view all orders (they need access to customer orders for sales management)
CREATE POLICY "Sales can view all orders"
ON public.orders
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'sales'
  )
);

-- Policy for admin to modify orders
CREATE POLICY "Admin can modify all orders"
ON public.orders
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Policy for sales to modify orders
CREATE POLICY "Sales can modify orders"
ON public.orders
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'sales'
  )
);

-- Policy for creating order items
CREATE POLICY "Enable insert for order items"
ON public.order_items
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE id = order_items.order_id
  )
);

-- Policy for viewing order items
CREATE POLICY "Enable select for order items"
ON public.order_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE id = order_items.order_id
    AND (customer_profile_id = auth.uid() OR customer_profile_id::text LIKE 'guest%')
  )
);

-- Policy for admin to view all order items
CREATE POLICY "Admin can view all order items"
ON public.order_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Policy for sales to view all order items
CREATE POLICY "Sales can view all order items"
ON public.order_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'sales'
  )
);
