-- Fix order notification triggers
-- This script ensures that the notification triggers are properly set up

-- First, check if the function exists and drop it if it does
DROP FUNCTION IF EXISTS notify_order_status CASCADE;

-- Create the notification function with improved debugging
CREATE OR REPLACE FUNCTION notify_order_status()
RETURNS TRIGGER AS $$
DECLARE
    payload json;
BEGIN
    -- Notify only on INSERT or UPDATE if the status is 'pending'
    IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND NEW.status = 'pending' THEN
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
        
    -- Notify on DELETE only if the status was 'pending'
    ELSIF TG_OP = 'DELETE' AND OLD.status = 'pending' THEN
        payload := json_build_object(
            'event', 'DELETE',
            'id', OLD.id
        );
        
        -- Send notification on both channels for redundancy
        PERFORM pg_notify('order_status_channel', payload::text);
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS order_status_trigger ON public.orders;

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
