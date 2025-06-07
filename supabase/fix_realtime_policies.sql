-- Fix RLS policies to restore real-time functionality
-- The issue: Multiple overlapping SELECT policies can cause conflicts

-- First, drop all the overlapping policies
DROP POLICY IF EXISTS "Enable select for users based on customer_profile_id" ON public.orders;
DROP POLICY IF EXISTS "Admin can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Sales can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Admin can modify all orders" ON public.orders;
DROP POLICY IF EXISTS "Sales can modify orders" ON public.orders;

-- Create a single, comprehensive SELECT policy
CREATE POLICY "Comprehensive orders access policy"
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

-- Create a single, comprehensive UPDATE policy
CREATE POLICY "Comprehensive orders update policy"
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

-- Create a single INSERT policy
CREATE POLICY "Comprehensive orders insert policy"
ON public.orders
FOR INSERT
WITH CHECK (
  -- Allow all authenticated users to create orders
  auth.uid() IS NOT NULL
  OR
  -- Allow guest orders
  customer_profile_id::text LIKE 'guest%'
);

-- Fix order_items policies similarly
DROP POLICY IF EXISTS "Enable select for order items" ON public.order_items;
DROP POLICY IF EXISTS "Admin can view all order items" ON public.order_items;
DROP POLICY IF EXISTS "Sales can view all order items" ON public.order_items;

-- Single comprehensive policy for order_items
CREATE POLICY "Comprehensive order_items access policy"
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