-- Profiles Policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for users based on role" ON public.profiles;
DROP POLICY IF EXISTS "Enable delete for admin" ON public.profiles;
DROP POLICY IF EXISTS "Enable self-insert during auth" ON public.profiles;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Base policy - authenticated users can read profiles
CREATE POLICY "Enable read access for authenticated users" ON public.profiles
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
  );

-- Allow users to create their own initial profile
CREATE POLICY "Enable self-insert during auth" ON public.profiles
  FOR INSERT
  WITH CHECK (
    auth.uid() = id
    AND role = 'customer'
  );

-- Allow admins and sales to create additional profiles
CREATE POLICY "Enable insert for authenticated users" ON public.profiles
  FOR INSERT
  WITH CHECK (
    -- New profiles can only be customers
    role = 'customer'
    AND
    -- Check if inserting user is admin or sales using a direct subquery
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'sales')
    )
  );

-- Update policy with non-recursive role checks
CREATE POLICY "Enable update for users based on role" ON public.profiles
  FOR UPDATE
  USING (
    -- Users can always update their own profile
    auth.uid() = id
    OR
    -- Admin check using direct subquery
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
    OR
    -- Sales can update customer profiles
    (
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role = 'sales'
      )
      AND role = 'customer'
    )
  );

-- Delete policy with non-recursive admin check
CREATE POLICY "Enable delete for admin" ON public.profiles
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
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
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND (
        role = 'admin'
        OR (role = 'sales' AND profile_id = auth.uid())
        OR (role = 'customer' AND customer_profile_id = auth.uid())
      )
    )
  );

CREATE POLICY "Enable insert access for admin and sales" ON public.orders
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'sales')
    )
  );

CREATE POLICY "Enable update access for admin and sales" ON public.orders
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND (
        role = 'admin'
        OR (role = 'sales' AND profile_id = auth.uid())
      )
    )
  );

CREATE POLICY "Enable delete access for admin and sales" ON public.orders
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND (
        role = 'admin'
        OR (role = 'sales' AND profile_id = auth.uid())
      )
    )
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
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND (
        role = 'admin'
        OR (
          role = 'sales'
          AND order_id IN (SELECT id FROM public.orders WHERE profile_id = auth.uid())
        )
        OR (
          role = 'customer'
          AND order_id IN (SELECT id FROM public.orders WHERE customer_profile_id = auth.uid())
        )
      )
    )
  );

CREATE POLICY "Enable insert access for admin and sales" ON public.order_items
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'sales')
    )
  );

CREATE POLICY "Enable update access for admin and sales" ON public.order_items
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND (
        role = 'admin'
        OR (
          role = 'sales'
          AND order_id IN (SELECT id FROM public.orders WHERE profile_id = auth.uid())
        )
      )
    )
  );

CREATE POLICY "Enable delete access for admin and sales" ON public.order_items
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND (
        role = 'admin'
        OR (
          role = 'sales'
          AND order_id IN (SELECT id FROM public.orders WHERE profile_id = auth.uid())
        )
      )
    )
  );
