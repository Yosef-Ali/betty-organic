-- CLEAN UP ALL EXISTING POLICIES
-- This will remove ALL policies for orders and order_items tables

-- Drop all order policies
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'orders' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.orders', pol.policyname);
        RAISE NOTICE 'Dropped policy: %', pol.policyname;
    END LOOP;
END $$;

-- Drop all order_items policies
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'order_items' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.order_items', pol.policyname);
        RAISE NOTICE 'Dropped policy: %', pol.policyname;
    END LOOP;
END $$;

-- Verify all policies are dropped
SELECT 'After cleanup - remaining policies:' as status;
SELECT schemaname, tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename IN ('orders', 'order_items');

-- Now create SIMPLE, NON-OVERLAPPING policies

-- ORDERS TABLE POLICIES

-- 1. SELECT: Everyone can see relevant orders
CREATE POLICY "orders_select" ON public.orders FOR SELECT
USING (
    customer_profile_id = auth.uid() -- Customers see their own
    OR customer_profile_id::text LIKE 'guest%' -- Guest orders
    OR EXISTS ( -- Admin/Sales see all
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role IN ('admin', 'sales')
    )
);

-- 2. INSERT: Anyone can create orders
CREATE POLICY "orders_insert" ON public.orders FOR INSERT
WITH CHECK (
    auth.uid() IS NOT NULL -- Must be authenticated
    OR customer_profile_id::text LIKE 'guest%' -- Or guest order
);

-- 3. UPDATE: Users can update their own, admin/sales can update any
CREATE POLICY "orders_update" ON public.orders FOR UPDATE
USING (
    customer_profile_id = auth.uid() -- Own orders
    OR EXISTS ( -- Admin/Sales
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role IN ('admin', 'sales')
    )
);

-- 4. DELETE: Only admin can delete
CREATE POLICY "orders_delete" ON public.orders FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- ORDER_ITEMS TABLE POLICIES

-- 1. SELECT: Can see items for orders you can see
CREATE POLICY "order_items_select" ON public.order_items FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.orders o
        WHERE o.id = order_items.order_id
        AND (
            o.customer_profile_id = auth.uid()
            OR o.customer_profile_id::text LIKE 'guest%'
            OR EXISTS (
                SELECT 1 FROM public.profiles 
                WHERE id = auth.uid() AND role IN ('admin', 'sales')
            )
        )
    )
);

-- 2. INSERT: Can add items to orders you can access
CREATE POLICY "order_items_insert" ON public.order_items FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.orders o
        WHERE o.id = order_items.order_id
        AND (
            o.customer_profile_id = auth.uid()
            OR o.customer_profile_id::text LIKE 'guest%'
            OR EXISTS (
                SELECT 1 FROM public.profiles 
                WHERE id = auth.uid() AND role IN ('admin', 'sales')
            )
        )
    )
);

-- 3. UPDATE: Admin/Sales only
CREATE POLICY "order_items_update" ON public.order_items FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role IN ('admin', 'sales')
    )
);

-- 4. DELETE: Admin only
CREATE POLICY "order_items_delete" ON public.order_items FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Final check - should show exactly 4 policies per table
SELECT 'Final policies:' as status;
SELECT schemaname, tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename IN ('orders', 'order_items')
ORDER BY tablename, cmd;

-- Enable Row Level Security (in case it's not enabled)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON public.orders TO authenticated;
GRANT ALL ON public.order_items TO authenticated;

-- Ensure realtime is enabled for the tables (skip if already enabled)
DO $$ 
BEGIN
    -- Check if orders table is already in the publication
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'orders'
    ) THEN
        ALTER publication supabase_realtime ADD TABLE public.orders;
    END IF;
END $$;

-- Test the policies with a simple query
SELECT 'Testing policies - you should see orders based on your role:' as status;
SELECT id, status, customer_profile_id, created_at 
FROM public.orders 
LIMIT 5;