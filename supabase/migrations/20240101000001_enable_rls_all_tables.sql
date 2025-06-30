-- Enable RLS on all tables that should have it enabled
-- This migration ensures RLS is enabled for security

-- Enable RLS on orders table
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Enable RLS on profiles table (if not already enabled)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Enable RLS on order_items table (if not already enabled)
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Enable RLS on products table (if not already enabled)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Check if RLS policies exist for orders table
-- If they don't exist, create basic policies

-- Policy for authenticated users to view their own orders
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'orders' 
        AND policyname = 'orders_select'
    ) THEN
        CREATE POLICY orders_select ON public.orders
            FOR SELECT
            USING (
                auth.uid() = profile_id 
                OR auth.uid() = customer_profile_id
                OR EXISTS (
                    SELECT 1 FROM profiles 
                    WHERE profiles.id = auth.uid() 
                    AND profiles.role IN ('admin', 'sales')
                )
            );
    END IF;
END $$;

-- Policy for inserting orders (authenticated users and service role)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'orders' 
        AND policyname = 'orders_insert'
    ) THEN
        CREATE POLICY orders_insert ON public.orders
            FOR INSERT
            WITH CHECK (
                auth.uid() = profile_id 
                OR auth.uid() = customer_profile_id
                OR EXISTS (
                    SELECT 1 FROM profiles 
                    WHERE profiles.id = auth.uid() 
                    AND profiles.role IN ('admin', 'sales')
                )
                OR auth.role() = 'service_role'
            );
    END IF;
END $$;

-- Policy for updating orders
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'orders' 
        AND policyname = 'orders_update'
    ) THEN
        CREATE POLICY orders_update ON public.orders
            FOR UPDATE
            USING (
                EXISTS (
                    SELECT 1 FROM profiles 
                    WHERE profiles.id = auth.uid() 
                    AND profiles.role IN ('admin', 'sales')
                )
            );
    END IF;
END $$;

-- Policy for deleting orders
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'orders' 
        AND policyname = 'orders_delete'
    ) THEN
        CREATE POLICY orders_delete ON public.orders
            FOR DELETE
            USING (
                EXISTS (
                    SELECT 1 FROM profiles 
                    WHERE profiles.id = auth.uid() 
                    AND profiles.role = 'admin'
                )
            );
    END IF;
END $$;

-- Create a policy for service role to bypass RLS (for server-side operations)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'orders' 
        AND policyname = 'service_role_orders_all'
    ) THEN
        CREATE POLICY service_role_orders_all ON public.orders
            FOR ALL
            USING (auth.role() = 'service_role');
    END IF;
END $$;

-- Enable RLS policies for order_items
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'order_items' 
        AND policyname = 'order_items_select'
    ) THEN
        CREATE POLICY order_items_select ON public.order_items
            FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 FROM orders 
                    WHERE orders.id = order_items.order_id 
                    AND (
                        orders.profile_id = auth.uid() 
                        OR orders.customer_profile_id = auth.uid()
                        OR EXISTS (
                            SELECT 1 FROM profiles 
                            WHERE profiles.id = auth.uid() 
                            AND profiles.role IN ('admin', 'sales')
                        )
                    )
                )
            );
    END IF;
END $$;

-- Policy for service role to bypass RLS on order_items
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'order_items' 
        AND policyname = 'service_role_order_items_all'
    ) THEN
        CREATE POLICY service_role_order_items_all ON public.order_items
            FOR ALL
            USING (auth.role() = 'service_role');
    END IF;
END $$;

-- Enable public read access for products (if needed)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'products' 
        AND policyname = 'products_select_public'
    ) THEN
        CREATE POLICY products_select_public ON public.products
            FOR SELECT
            USING (true);
    END IF;
END $$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.products TO anon, authenticated;
GRANT ALL ON public.orders TO authenticated;
GRANT ALL ON public.order_items TO authenticated;
GRANT ALL ON public.profiles TO authenticated;
