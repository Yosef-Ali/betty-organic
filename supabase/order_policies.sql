-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.orders;
DROP POLICY IF EXISTS "Enable select for users based on customer_id" ON public.orders;
DROP POLICY IF EXISTS "Sales can create orders" ON public.orders;
DROP POLICY IF EXISTS "Sales can view their orders" ON public.orders;

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to create orders
CREATE POLICY "Enable insert for authenticated users"
ON public.orders
FOR INSERT
WITH CHECK (auth.role() IN ('authenticated', 'sales'));

-- Policy for users to view their own orders
CREATE POLICY "Enable select for users based on customer_id"
ON public.orders
FOR SELECT
USING (customer_profile_id = auth.uid());

-- Allow authenticated users to create order items
CREATE POLICY "Enable insert for authenticated users"
ON public.order_items
FOR INSERT
WITH CHECK (
  auth.role() IN ('authenticated', 'sales') AND
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE id = order_items.order_id
    AND customer_profile_id = auth.uid()
  )
);

-- Allow users to view their own order items
CREATE POLICY "Enable select for order owners"
ON public.order_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE id = order_items.order_id
    AND customer_profile_id = auth.uid()
  )
);
