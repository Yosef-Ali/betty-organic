-- Remote Supabase Notification System Fix
-- Run this script in the Supabase SQL Editor to fix the notification system

-- Drop existing function and trigger
DROP FUNCTION IF EXISTS notify_order_status() CASCADE;

-- Create the notification function
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
        
        -- Send notification
        PERFORM pg_notify('order_status_channel', payload::text);
        
    -- Notify on DELETE only if the status was 'pending'
    ELSIF TG_OP = 'DELETE' AND OLD.status = 'pending' THEN
        payload := json_build_object(
            'event', 'DELETE',
            'id', OLD.id
        );
        
        -- Send notification
        PERFORM pg_notify('order_status_channel', payload::text);
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS order_status_trigger ON public.orders;
CREATE TRIGGER order_status_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.orders
FOR EACH ROW EXECUTE FUNCTION notify_order_status();

-- Enable realtime
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR ALL TABLES;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

-- Verify the trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'order_status_trigger';

-- Verify realtime is enabled
SELECT * FROM pg_publication WHERE pubname = 'supabase_realtime';

-- Create a test pending order (uncomment to run)
/*
WITH admin_user AS (
  SELECT id FROM profiles WHERE role = 'admin' LIMIT 1
)
INSERT INTO orders (
  profile_id, 
  customer_profile_id, 
  total_amount, 
  status, 
  type, 
  display_id
)
SELECT 
  id, 
  id, 
  99.99, 
  'pending', 
  'test', 
  'TEST-' || floor(random() * 1000000)
FROM admin_user
RETURNING id;
*/
