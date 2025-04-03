-- Enable the pgcrypto extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Enable the pg_stat_statements extension for monitoring
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Enable publication for all tables (required for realtime)
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR ALL TABLES;

-- Add the orders table to the realtime publication explicitly
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

-- Create a function to listen for order_status_channel notifications and broadcast them
CREATE OR REPLACE FUNCTION broadcast_order_status()
RETURNS TRIGGER AS $$
BEGIN
  -- This function will be called by the trigger and will broadcast the notification
  -- to all clients subscribed to the 'order_status_channel' channel
  PERFORM pg_notify('order_status_channel', row_to_json(NEW)::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to call the broadcast function
DROP TRIGGER IF EXISTS broadcast_order_status_trigger ON public.orders;
CREATE TRIGGER broadcast_order_status_trigger
AFTER INSERT OR UPDATE OF status ON public.orders
FOR EACH ROW
WHEN (NEW.status = 'pending')
EXECUTE FUNCTION broadcast_order_status();

-- Comment to explain the purpose of these changes
COMMENT ON FUNCTION broadcast_order_status() IS 'Broadcasts order status changes to the order_status_channel for realtime notifications';
COMMENT ON TRIGGER broadcast_order_status_trigger ON public.orders IS 'Triggers the broadcast of pending order notifications';
