-- Comprehensive fix for realtime notification system
-- Run this in Supabase SQL Editor

-- 1. Drop existing function and triggers to start fresh
DROP FUNCTION IF EXISTS notify_order_status() CASCADE;

-- 2. Create the notification function with enhanced logging
CREATE OR REPLACE FUNCTION notify_order_status()
RETURNS TRIGGER AS $$
DECLARE
    payload json;
BEGIN
    -- Log all trigger events for debugging
    RAISE NOTICE 'Order trigger fired: event=%, order_id=%, status=%', TG_OP, COALESCE(NEW.id, OLD.id), COALESCE(NEW.status, OLD.status);
    
    -- Notify on INSERT or UPDATE for any status (let client filter)
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        payload := json_build_object(
            'event', TG_OP,
            'id', NEW.id,
            'profile_id', NEW.profile_id,
            'customer_profile_id', NEW.customer_profile_id,
            'status', NEW.status,
            'created_at', NEW.created_at,
            'updated_at', NEW.updated_at,
            'total_amount', NEW.total_amount,
            'display_id', NEW.display_id,
            'type', NEW.type
        );
        
        -- Send notification
        PERFORM pg_notify('order_status_channel', payload::text);
        RAISE NOTICE 'Notification sent for % order: %', TG_OP, NEW.id;
        
    -- Notify on DELETE 
    ELSIF TG_OP = 'DELETE' THEN
        payload := json_build_object(
            'event', 'DELETE',
            'id', OLD.id,
            'status', OLD.status
        );
        
        -- Send notification
        PERFORM pg_notify('order_status_channel', payload::text);
        RAISE NOTICE 'Notification sent for DELETE order: %', OLD.id;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 3. Create the trigger
DROP TRIGGER IF EXISTS order_status_trigger ON public.orders;
CREATE TRIGGER order_status_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION notify_order_status();

-- 4. Fix RLS policies for orders table
-- Drop existing policies
DROP POLICY IF EXISTS "Enable select for users based on customer_profile_id" ON public.orders;
DROP POLICY IF EXISTS "Admin can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Sales can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Customer can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Admin can insert orders" ON public.orders;
DROP POLICY IF EXISTS "Sales can insert orders" ON public.orders;
DROP POLICY IF EXISTS "Admin can update orders" ON public.orders;
DROP POLICY IF EXISTS "Sales can update orders" ON public.orders;
DROP POLICY IF EXISTS "Admin can delete orders" ON public.orders;

-- Create comprehensive RLS policies
-- SELECT policies
CREATE POLICY "Customer can view own orders"
ON public.orders FOR SELECT
USING (customer_profile_id = auth.uid());

CREATE POLICY "Admin can view all orders"
ON public.orders FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Sales can view all orders"
ON public.orders FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'sales'
  )
);

-- INSERT policies
CREATE POLICY "Admin can insert orders"
ON public.orders FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Sales can insert orders"
ON public.orders FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'sales'
  )
);

-- UPDATE policies
CREATE POLICY "Admin can update orders"
ON public.orders FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Sales can update orders"
ON public.orders FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'sales'
  )
);

-- DELETE policies
CREATE POLICY "Admin can delete orders"
ON public.orders FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 5. Ensure realtime is properly enabled
-- Check if publication exists and recreate if needed
DO $$
BEGIN
    -- Drop and recreate publication to ensure clean state
    DROP PUBLICATION IF EXISTS supabase_realtime;
    CREATE PUBLICATION supabase_realtime FOR ALL TABLES;
    
    -- Explicitly add orders table
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
    
    RAISE NOTICE 'Realtime publication recreated successfully';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error with publication: %', SQLERRM;
END
$$;

-- 6. Create a test function to verify the system
CREATE OR REPLACE FUNCTION test_notification_system()
RETURNS json AS $$
DECLARE
    test_order_id uuid;
    admin_user_id uuid;
    result json;
BEGIN
    -- Get an admin user
    SELECT id INTO admin_user_id 
    FROM public.profiles 
    WHERE role = 'admin' 
    LIMIT 1;
    
    IF admin_user_id IS NULL THEN
        RETURN json_build_object('error', 'No admin user found');
    END IF;
    
    -- Create a test order
    INSERT INTO public.orders (
        profile_id, 
        customer_profile_id, 
        total_amount, 
        status, 
        type, 
        display_id
    ) VALUES (
        admin_user_id,
        admin_user_id,
        99.99,
        'pending',
        'test',
        'TEST-' || floor(random() * 1000000)
    ) RETURNING id INTO test_order_id;
    
    result := json_build_object(
        'success', true,
        'test_order_id', test_order_id,
        'admin_user_id', admin_user_id,
        'message', 'Test order created successfully'
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 7. Verify the setup
SELECT 
    'Trigger Status' as check_type,
    CASE WHEN EXISTS(SELECT 1 FROM pg_trigger WHERE tgname = 'order_status_trigger') 
         THEN 'EXISTS' ELSE 'MISSING' END as status
UNION ALL
SELECT 
    'Function Status' as check_type,
    CASE WHEN EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'notify_order_status') 
         THEN 'EXISTS' ELSE 'MISSING' END as status
UNION ALL
SELECT 
    'Publication Status' as check_type,
    CASE WHEN EXISTS(SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') 
         THEN 'EXISTS' ELSE 'MISSING' END as status;

-- To test the system, run:
-- SELECT test_notification_system();
