-- Profiles Policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for users based on role" ON public.profiles;
DROP POLICY IF EXISTS "Enable delete for admin" ON public.profiles;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for authenticated users" ON public.profiles
  FOR SELECT
  USING (
    (SELECT auth.uid()) IN (SELECT id FROM public.profiles WHERE role = 'admin')
    OR (SELECT auth.uid()) IN (SELECT id FROM public.profiles WHERE role = 'sales' AND (auth.uid() = id OR role = 'customer'))
    OR (SELECT auth.uid()) = id
  );

CREATE POLICY "Enable insert for authenticated users" ON public.profiles
  FOR INSERT
  WITH CHECK (
    (SELECT auth.uid()) IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'sales'))
    AND role = 'customer'
  );

CREATE POLICY "Enable update for users based on role" ON public.profiles
  FOR UPDATE
  USING (
    (SELECT auth.uid()) IN (SELECT id FROM public.profiles WHERE role = 'admin')
    OR (SELECT auth.uid()) IN (SELECT id FROM public.profiles WHERE role = 'sales' AND role = 'customer')
    OR (SELECT auth.uid()) = id
  );

CREATE POLICY "Enable delete for admin" ON public.profiles
  FOR DELETE
  USING (
    (SELECT auth.uid()) IN (SELECT id FROM public.profiles WHERE role = 'admin')
    AND role = 'customer'
  );

-- Orders Policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.orders;
DROP POLICY IF EXISTS "Enable insert access for admin and sales" ON public.orders;
DROP POLICY IF EXISTS "Enable update access for admin and sales" ON public.orders;
DROP POLICY IF EXISTS "Enable delete access for admin and sales" ON public.orders;

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for authenticated users" ON public.orders
  FOR SELECT
  USING (
    (SELECT auth.uid()) IN (SELECT id FROM public.profiles WHERE role = 'admin')
    OR (SELECT auth.uid()) IN (SELECT id FROM public.profiles WHERE role = 'sales' AND profile_id = (SELECT auth.uid()))
    OR (SELECT auth.uid()) IN (SELECT id FROM public.profiles WHERE role = 'customer' AND customer_profile_id = (SELECT auth.uid()))
  );

CREATE POLICY "Enable insert access for admin and sales" ON public.orders
  FOR INSERT
  WITH CHECK (
    (SELECT auth.uid()) IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'sales'))
  );

CREATE POLICY "Enable update access for admin and sales" ON public.orders
  FOR UPDATE
  USING (
    (SELECT auth.uid()) IN (SELECT id FROM public.profiles WHERE role = 'admin')
    OR (SELECT auth.uid()) IN (SELECT id FROM public.profiles WHERE role = 'sales' AND profile_id = (SELECT auth.uid()))
  );

CREATE POLICY "Enable delete access for admin and sales" ON public.orders
  FOR DELETE
  USING (
    (SELECT auth.uid()) IN (SELECT id FROM public.profiles WHERE role = 'admin')
    OR (SELECT auth.uid()) IN (SELECT id FROM public.profiles WHERE role = 'sales' AND profile_id = (SELECT auth.uid()))
  );

-- Order Items Policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.order_items;
DROP POLICY IF EXISTS "Enable insert access for admin and sales" ON public.order_items;
DROP POLICY IF EXISTS "Enable update access for admin and sales" ON public.order_items;
DROP POLICY IF EXISTS "Enable delete access for admin and sales" ON public.order_items;

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for authenticated users" ON public.order_items
  FOR SELECT
  USING (
    (SELECT auth.uid()) IN (SELECT id FROM public.profiles WHERE role = 'admin')
    OR (SELECT auth.uid()) IN (SELECT id FROM public.profiles WHERE role = 'sales' AND order_id IN (SELECT id FROM public.orders WHERE profile_id = (SELECT auth.uid())))
    OR (SELECT auth.uid()) IN (SELECT id FROM public.profiles WHERE role = 'customer' AND order_id IN (SELECT id FROM public.orders WHERE customer_profile_id = (SELECT auth.uid())))
  );

CREATE POLICY "Enable insert access for admin and sales" ON public.order_items
  FOR INSERT
  WITH CHECK (
    (SELECT auth.uid()) IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'sales'))
  );

CREATE POLICY "Enable update access for admin and sales" ON public.order_items
  FOR UPDATE
  USING (
    (SELECT auth.uid()) IN (SELECT id FROM public.profiles WHERE role = 'admin')
    OR (SELECT auth.uid()) IN (SELECT id FROM public.profiles WHERE role = 'sales' AND order_id IN (SELECT id FROM public.orders WHERE profile_id = (SELECT auth.uid())))
  );

CREATE POLICY "Enable delete access for admin and sales" ON public.order_items
  FOR DELETE
  USING (
    (SELECT auth.uid()) IN (SELECT id FROM public.profiles WHERE role = 'admin')
    OR (SELECT auth.uid()) IN (SELECT id FROM public.profiles WHERE role = 'sales' AND order_id IN (SELECT id FROM public.orders WHERE profile_id = (SELECT auth.uid())))
  );
