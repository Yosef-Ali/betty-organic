-- Fix RLS policies to restore real-time functionality
-- First, drop ALL existing policies to avoid conflicts

-- Drop all existing order policies
DROP POLICY IF EXISTS "Enable select for users based on customer_profile_id" ON public.orders;
DROP POLICY IF EXISTS "Admin can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Sales can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Admin can modify all orders" ON public.orders;
DROP POLICY IF EXISTS "Sales can modify orders" ON public.orders;
DROP POLICY IF EXISTS "Comprehensive orders access policy" ON public.orders;
DROP POLICY IF EXISTS "Comprehensive orders update policy" ON public.orders;
DROP POLICY IF EXISTS "Comprehensive orders insert policy" ON public.orders;
DROP POLICY IF EXISTS "Enable insert for all authenticated users" ON public.orders;
DROP POLICY IF EXISTS "Enable update for users based on customer_profile_id" ON public.orders;
DROP POLICY IF EXISTS "Enable delete for admins" ON public.orders;

-- Drop all existing order_items policies
DROP POLICY IF EXISTS "Enable select for order items" ON public.order_items;
DROP POLICY IF EXISTS "Admin can view all order items" ON public.order_items;
DROP POLICY IF EXISTS "Sales can view all order items" ON public.order_items;
DROP POLICY IF EXISTS "Comprehensive order_items access policy" ON public.order_items;
DROP POLICY IF EXISTS "Enable insert for order items" ON public.order_items;
DROP POLICY IF EXISTS "Enable update for order items" ON public.order_items;
DROP POLICY IF EXISTS "Enable delete for order items" ON public.order_items;

-- Now create the new consolidated policies

-- Create a single, comprehensive SELECT policy for orders
CREATE POLICY "orders_select_policy"
ON public.orders
FOR SELECT
USING (
  -- Customers can see their own orders
  customer_profile_id = auth.uid() 
  OR 
  -- Guest orders
  customer_profile_id::text LIKE 'guest%'
  OR
  -- Admin can see all orders
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
  OR
  -- Sales can see all orders
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'sales'
  )
);

-- Create a single, comprehensive UPDATE policy for orders
CREATE POLICY "orders_update_policy"
ON public.orders
FOR UPDATE
USING (
  -- Users can update their own orders
  customer_profile_id = auth.uid()
  OR
  -- Admin can update all orders
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
  OR
  -- Sales can update all orders
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'sales'
  )
);

-- Create a single INSERT policy for orders
CREATE POLICY "orders_insert_policy"
ON public.orders
FOR INSERT
WITH CHECK (
  -- Allow all authenticated users to create orders
  auth.uid() IS NOT NULL
  OR
  -- Allow guest orders
  customer_profile_id::text LIKE 'guest%'
);

-- Create a single DELETE policy for orders (admin only)
CREATE POLICY "orders_delete_policy"
ON public.orders
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Single comprehensive SELECT policy for order_items
CREATE POLICY "order_items_select_policy"
ON public.order_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE id = order_items.order_id
    AND (
      -- Customer's own orders
      customer_profile_id = auth.uid() 
      OR 
      -- Guest orders
      customer_profile_id::text LIKE 'guest%'
      OR
      -- Admin can see all
      EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
      )
      OR
      -- Sales can see all
      EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'sales'
      )
    )
  )
);

-- INSERT policy for order_items
CREATE POLICY "order_items_insert_policy"
ON public.order_items
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE id = order_items.order_id
    AND (
      customer_profile_id = auth.uid() 
      OR 
      customer_profile_id::text LIKE 'guest%'
      OR
      EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role IN ('admin', 'sales')
      )
    )
  )
);

-- UPDATE policy for order_items
CREATE POLICY "order_items_update_policy"
ON public.order_items
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE id = order_items.order_id
    AND (
      customer_profile_id = auth.uid()
      OR
      EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role IN ('admin', 'sales')
      )
    )
  )
);

-- DELETE policy for order_items (admin only)
CREATE POLICY "order_items_delete_policy"
ON public.order_items
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Verify policies are created
SELECT schemaname, tablename, policyname, permissive, cmd 
FROM pg_policies 
WHERE tablename IN ('orders', 'order_items')
ORDER BY tablename, cmd;