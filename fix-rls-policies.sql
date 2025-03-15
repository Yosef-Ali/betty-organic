-- Clean up and simplify orders and order_items RLS policies
-- This script will remove all existing policies and add simplified ones

DO $$
BEGIN
    -- First, drop ALL existing policies on orders
    DROP POLICY IF EXISTS "Allow sales and admin to create orders" ON public.orders;
    DROP POLICY IF EXISTS "Anyone authenticated can create orders" ON public.orders;
    DROP POLICY IF EXISTS "Enable delete access for admin and sales" ON public.orders;
    DROP POLICY IF EXISTS "Enable insert access for sales and admin" ON public.orders;
    DROP POLICY IF EXISTS "Enable insert for all users" ON public.orders;
    DROP POLICY IF EXISTS "Enable insert for customers" ON public.orders;
    DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.orders;
    DROP POLICY IF EXISTS "Enable select for users based on profile" ON public.orders;
    DROP POLICY IF EXISTS "Enable update access for admin and sales" ON public.orders;
    DROP POLICY IF EXISTS "Users can insert own orders" ON public.orders;
    DROP POLICY IF EXISTS "Users can update own orders" ON public.orders;
    DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
    DROP POLICY IF EXISTS "customer_manage_orders" ON public.orders;

    -- Drop ALL existing policies on order_items
    DROP POLICY IF EXISTS "Anyone authenticated can create order items" ON public.order_items;
    DROP POLICY IF EXISTS "Enable delete access for admin and sales" ON public.order_items;
    DROP POLICY IF EXISTS "Enable insert access for order items" ON public.order_items;
    DROP POLICY IF EXISTS "Enable insert for order items" ON public.order_items;
    DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.order_items;
    DROP POLICY IF EXISTS "Enable read access for order items" ON public.order_items;
    DROP POLICY IF EXISTS "Enable select for order items" ON public.order_items;
    DROP POLICY IF EXISTS "Enable update access for admin and sales" ON public.order_items;
    DROP POLICY IF EXISTS "Users can insert own order items" ON public.order_items;
    DROP POLICY IF EXISTS "Users can view own order items" ON public.order_items;

    -- Make sure RLS is enabled
    ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

    -- Create simplified INSERT policy for orders
    -- This allows any authenticated user to create orders
    CREATE POLICY "Allow any authenticated user to create orders"
    ON public.orders
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

    -- Create a policy for customers to view their own orders
    CREATE POLICY "Customers can view their own orders"
    ON public.orders
    FOR SELECT
    TO authenticated
    USING (
        customer_profile_id = auth.uid() OR  -- Customer viewing their own orders
        profile_id = auth.uid() OR           -- Sales/Admin viewing orders they created
        EXISTS (                             -- Admin can see all orders
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

    -- Create a policy for update/delete access
    CREATE POLICY "Admin and sales can update orders"
    ON public.orders
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND (
                profiles.role = 'admin' OR
                (profiles.role = 'sales' AND orders.profile_id = auth.uid())
            )
        )
    );

    -- Create simplified policy for deleting orders
    CREATE POLICY "Admin and sales can delete orders"
    ON public.orders
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND (
                profiles.role = 'admin' OR
                (profiles.role = 'sales' AND orders.profile_id = auth.uid())
            )
        )
    );

    -- Create simplified INSERT policy for order_items
    -- This allows any authenticated user to create order items
    CREATE POLICY "Allow any authenticated user to create order items"
    ON public.order_items
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

    -- Create a policy for viewing order items
    CREATE POLICY "Users can view relevant order items"
    ON public.order_items
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM orders
            WHERE orders.id = order_items.order_id
            AND (
                orders.customer_profile_id = auth.uid() OR
                orders.profile_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM profiles
                    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
                )
            )
        )
    );

    -- Admin/sales can update order items
    CREATE POLICY "Admin and sales can update order items"
    ON public.order_items
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM orders, profiles
            WHERE orders.id = order_items.order_id
            AND profiles.id = auth.uid()
            AND (
                profiles.role = 'admin' OR
                (profiles.role = 'sales' AND orders.profile_id = auth.uid())
            )
        )
    );

    -- Admin/sales can delete order items
    CREATE POLICY "Admin and sales can delete order items"
    ON public.order_items
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM orders, profiles
            WHERE orders.id = order_items.order_id
            AND profiles.id = auth.uid()
            AND (
                profiles.role = 'admin' OR
                (profiles.role = 'sales' AND orders.profile_id = auth.uid())
            )
        )
    );

    -- Grant necessary permissions
    GRANT ALL ON public.orders TO authenticated;
    GRANT ALL ON public.order_items TO authenticated;

    -- For API calls that might not be fully authenticated yet
    GRANT SELECT, INSERT ON public.orders TO anon;
    GRANT SELECT, INSERT ON public.order_items TO anon;
END
$$;

-- Add a verification query to check the new policies
SELECT
    tablename,
    policyname,
    cmd
FROM
    pg_policies
WHERE
    tablename IN ('orders', 'order_items')
ORDER BY
    tablename, cmd;
