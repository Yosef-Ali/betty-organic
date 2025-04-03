-- Simple fix for notification system
-- Run this in the Supabase SQL Editor

-- 1. Drop existing function and trigger
DROP FUNCTION IF EXISTS notify_order_status() CASCADE;

-- 2. Create the notification function
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

-- 3. Create the trigger
CREATE TRIGGER order_status_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.orders
FOR EACH ROW EXECUTE FUNCTION notify_order_status();

-- 4. Enable realtime
-- Check if publication exists
DO $$
BEGIN
    -- If the publication doesn't exist, create it
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime FOR TABLE public.orders;
        RAISE NOTICE 'Created new publication supabase_realtime';
    ELSE
        -- If it exists but is not FOR ALL TABLES, add the orders table
        IF NOT EXISTS (
            SELECT 1 FROM pg_publication p
            JOIN pg_publication_rel pr ON p.oid = pr.prpubid
            JOIN pg_class c ON pr.prrelid = c.oid
            WHERE p.pubname = 'supabase_realtime' AND c.relname = 'orders'
        ) AND NOT EXISTS (
            SELECT 1 FROM pg_publication
            WHERE pubname = 'supabase_realtime' AND puballtables = true
        ) THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
            RAISE NOTICE 'Added orders table to existing publication';
        ELSE
            RAISE NOTICE 'Publication already includes orders table or is FOR ALL TABLES';
        END IF;
    END IF;
END
$$;

-- 5. Create a test pending order (uncomment to run)
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
