-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Sales can create orders" ON public.orders;
DROP POLICY IF EXISTS "Sales can view their orders" ON public.orders;

-- Policy for sales to create orders
CREATE POLICY "Sales can create orders"
ON public.orders
FOR INSERT
WITH CHECK (auth.role() = 'sales');

-- Policy for sales to view their orders
CREATE POLICY "Sales can view their orders"
ON public.orders
FOR SELECT
USING (created_by = auth.uid());
