-- Script to fix notification triggers
-- This script ensures that the notification triggers are properly set up

-- First, check if the function exists and drop it if it does
DROP FUNCTION IF EXISTS notify_order_status CASCADE;

-- Create the notification function
CREATE OR REPLACE FUNCTION notify_order_status()
RETURNS TRIGGER AS $$
DECLARE
    payload json;
BEGIN
    -- Debug output
    RAISE NOTICE 'notify_order_status triggered: operation=%, table=%, schema=%', TG_OP, TG_TABLE_NAME, TG_TABLE_SCHEMA;
    
    -- Notify only on INSERT or UPDATE if the status is 'pending'
    IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND NEW.status = 'pending' THEN
        -- Debug output
        RAISE NOTICE 'Sending notification for pending order: id=%, status=%', NEW.id, NEW.status;
        
        payload := json_build_object(
            'event', TG_OP,
            'id', NEW.id,
            'profile_id', NEW.profile_id,
            'status', NEW.status,
            'created_at', NEW.created_at,
            'total_amount', NEW.total_amount
        );
        
        -- Send notification on both channels for redundancy
        PERFORM pg_notify('order_status_channel', payload::text);
        PERFORM pg_notify('realtime:order_status', payload::text);
        
        -- Debug output
        RAISE NOTICE 'Notification sent: %', payload::text;

    -- Notify on DELETE only if the status was 'pending'
    ELSIF TG_OP = 'DELETE' AND OLD.status = 'pending' THEN
        -- Debug output
        RAISE NOTICE 'Sending notification for deleted pending order: id=%', OLD.id;
        
        payload := json_build_object(
            'event', 'DELETE',
            'id', OLD.id
        );
        
        -- Send notification on both channels for redundancy
        PERFORM pg_notify('order_status_channel', payload::text);
        PERFORM pg_notify('realtime:order_status', payload::text);
        
        -- Debug output
        RAISE NOTICE 'Notification sent: %', payload::text;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS order_status_trigger ON public.orders;
DROP TRIGGER IF EXISTS order_created ON public.orders;
DROP TRIGGER IF EXISTS order_updated ON public.orders;
DROP TRIGGER IF EXISTS order_deleted ON public.orders;

-- Create a single trigger for all operations
CREATE TRIGGER order_status_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.orders
FOR EACH ROW EXECUTE FUNCTION notify_order_status();

-- Add comments for documentation
COMMENT ON FUNCTION notify_order_status() IS 'Sends notifications when orders with pending status are created, updated, or deleted';
COMMENT ON TRIGGER order_status_trigger ON public.orders IS 'Trigger to notify about pending order status changes';

-- Enable the pgcrypto extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Enable publication for realtime
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR ALL TABLES;

-- Add the orders table to the realtime publication explicitly
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

-- Verify the trigger is set up correctly
SELECT 
    trigger_name, 
    event_manipulation, 
    action_statement
FROM 
    information_schema.triggers
WHERE 
    event_object_table = 'orders'
    AND trigger_schema = 'public';

-- Verify the function exists
SELECT 
    routine_name, 
    routine_definition
FROM 
    information_schema.routines
WHERE 
    routine_name = 'notify_order_status'
    AND routine_schema = 'public';

-- Create a test function to manually trigger a notification
CREATE OR REPLACE FUNCTION test_order_notification()
RETURNS void AS $$
DECLARE
    payload json;
BEGIN
    payload := json_build_object(
        'event', 'TEST',
        'id', 'test-' || gen_random_uuid(),
        'status', 'pending',
        'created_at', now()
    );
    
    PERFORM pg_notify('order_status_channel', payload::text);
    PERFORM pg_notify('realtime:order_status', payload::text);
    
    RAISE NOTICE 'Test notification sent: %', payload::text;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION test_order_notification() TO authenticated;
