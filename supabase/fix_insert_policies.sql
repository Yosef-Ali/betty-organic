-- Fix INSERT policies to allow order creation
-- The current policies are blocking legitimate order creation

-- Drop existing INSERT policies
DROP POLICY IF EXISTS "Enable insert for all users" ON public.orders;
DROP POLICY IF EXISTS "Comprehensive orders insert policy" ON public.orders;

-- Create a more permissive INSERT policy that allows authenticated users to create orders
CREATE POLICY "Allow authenticated users to create orders"
ON public.orders
FOR INSERT
WITH CHECK (
  -- Any authenticated user can create orders
  auth.uid() IS NOT NULL
  OR
  -- Allow guest orders (for guest checkout)
  customer_profile_id::text LIKE 'guest%'
);

-- Also ensure we have the correct SELECT policies
DROP POLICY IF EXISTS "Enable select for users based on customer_profile_id" ON public.orders;
DROP POLICY IF EXISTS "Admin can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Sales can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Comprehensive orders access policy" ON public.orders;

-- Create a single comprehensive SELECT policy
CREATE POLICY "Orders access policy"
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

-- Fix UPDATE policies
DROP POLICY IF EXISTS "Admin can modify all orders" ON public.orders;
DROP POLICY IF EXISTS "Sales can modify orders" ON public.orders;
DROP POLICY IF EXISTS "Comprehensive orders update policy" ON public.orders;

CREATE POLICY "Orders update policy"
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

-- Ensure order_items policies allow inserts
DROP POLICY IF EXISTS "Enable insert for order items" ON public.order_items;

CREATE POLICY "Allow order items insert"
ON public.order_items
FOR INSERT
WITH CHECK (
  -- Allow if the user can access the parent order
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE id = order_items.order_id
    AND (
      customer_profile_id = auth.uid()
      OR customer_profile_id::text LIKE 'guest%'
      OR EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role IN ('admin', 'sales')
      )
    )
  )
);