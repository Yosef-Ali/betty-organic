-- Migration to fix orders schema to match application code expectations
-- Date: 2024-07-01
-- Description: Update orders table to use profile_id and customer_profile_id instead of customer_id

-- Start a transaction
BEGIN;

-- First, check if the profiles table exists, if not create it
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY,
    email TEXT UNIQUE,
    name TEXT,
    phone TEXT,
    address TEXT,
    role TEXT DEFAULT 'customer',
    status TEXT DEFAULT 'active',
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Check if orders table has the old schema
DO $$
BEGIN
    -- Check if customer_id column exists (old schema)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'customer_id'
        AND table_schema = 'public'
    ) THEN
        -- Add new columns if they don't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'orders' 
            AND column_name = 'profile_id'
            AND table_schema = 'public'
        ) THEN
            ALTER TABLE public.orders ADD COLUMN profile_id UUID;
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'orders' 
            AND column_name = 'customer_profile_id'
            AND table_schema = 'public'
        ) THEN
            ALTER TABLE public.orders ADD COLUMN customer_profile_id UUID;
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'orders' 
            AND column_name = 'display_id'
            AND table_schema = 'public'
        ) THEN
            ALTER TABLE public.orders ADD COLUMN display_id TEXT;
        END IF;
        
        -- Copy data from customer_id to new columns (if there's existing data)
        UPDATE public.orders 
        SET 
            profile_id = COALESCE(profile_id, customer_id),
            customer_profile_id = COALESCE(customer_profile_id, customer_id)
        WHERE customer_id IS NOT NULL;
        
        -- Make the new columns NOT NULL after data migration
        ALTER TABLE public.orders ALTER COLUMN profile_id SET NOT NULL;
        ALTER TABLE public.orders ALTER COLUMN customer_profile_id SET NOT NULL;
        
        -- Drop the old foreign key constraint if it exists
        ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_customer_id_fkey;
        
        -- Add foreign key constraints for the new columns
        ALTER TABLE public.orders 
        ADD CONSTRAINT orders_profile_id_fkey 
        FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
        
        ALTER TABLE public.orders 
        ADD CONSTRAINT orders_customer_profile_id_fkey 
        FOREIGN KEY (customer_profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
        
        -- Drop the old customer_id column
        ALTER TABLE public.orders DROP COLUMN IF EXISTS customer_id;
    END IF;
END $$;

-- Ensure orders table has the correct structure for new installations
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL,
    customer_profile_id UUID NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    type TEXT NOT NULL DEFAULT 'online',
    total_amount NUMERIC NOT NULL,
    display_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create profiles policies
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
CREATE POLICY "profiles_select" ON public.profiles
    FOR SELECT
    USING (
        id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'sales')
        )
        OR auth.role() = 'service_role'
    );

DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
CREATE POLICY "profiles_insert" ON public.profiles
    FOR INSERT
    WITH CHECK (
        id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'sales')
        )
        OR auth.role() = 'service_role'
    );

DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
CREATE POLICY "profiles_update" ON public.profiles
    FOR UPDATE
    USING (
        id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'sales')
        )
        OR auth.role() = 'service_role'
    );

-- Allow service role full access to profiles
DROP POLICY IF EXISTS "service_role_profiles_all" ON public.profiles;
CREATE POLICY "service_role_profiles_all" ON public.profiles
    FOR ALL
    USING (auth.role() = 'service_role');

-- Update existing orders policies to use the new column names
DROP POLICY IF EXISTS "orders_select" ON public.orders;
CREATE POLICY "orders_select" ON public.orders
    FOR SELECT
    USING (
        auth.uid() = profile_id 
        OR auth.uid() = customer_profile_id
        OR EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'sales')
        )
        OR auth.role() = 'service_role'
    );

DROP POLICY IF EXISTS "orders_insert" ON public.orders;
CREATE POLICY "orders_insert" ON public.orders
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

DROP POLICY IF EXISTS "orders_update" ON public.orders;
CREATE POLICY "orders_update" ON public.orders
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'sales')
        )
        OR auth.role() = 'service_role'
    );

-- Allow service role full access to orders
DROP POLICY IF EXISTS "service_role_orders_all" ON public.orders;
CREATE POLICY "service_role_orders_all" ON public.orders
    FOR ALL
    USING (auth.role() = 'service_role');

-- Update order_items policies to work with new schema
DROP POLICY IF EXISTS "order_items_select" ON public.order_items;
CREATE POLICY "order_items_select" ON public.order_items
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
        OR auth.role() = 'service_role'
    );

DROP POLICY IF EXISTS "order_items_insert" ON public.order_items;
CREATE POLICY "order_items_insert" ON public.order_items
    FOR INSERT
    WITH CHECK (
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
        OR auth.role() = 'service_role'
    );

-- Allow service role full access to order_items
DROP POLICY IF EXISTS "service_role_order_items_all" ON public.order_items;
CREATE POLICY "service_role_order_items_all" ON public.order_items
    FOR ALL
    USING (auth.role() = 'service_role');

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.products TO anon, authenticated;
GRANT ALL ON public.orders TO authenticated;
GRANT ALL ON public.order_items TO authenticated;
GRANT ALL ON public.profiles TO authenticated;

-- Commit the transaction
COMMIT;