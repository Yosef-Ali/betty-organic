-- migrations/20250402111250_order_notification_triggers.sql
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
            'created_at', NEW.created_at
        );
        PERFORM pg_notify('order_status_channel', payload::text);

    -- Notify on DELETE only if the status was 'pending'
    ELSIF TG_OP = 'DELETE' AND OLD.status = 'pending' THEN
        payload := json_build_object(
            'event', 'DELETE',
            'id', OLD.id
        );
        PERFORM pg_notify('order_status_channel', payload::text);
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop existing triggers if they exist (optional, but good practice)
DROP TRIGGER IF EXISTS order_created ON orders;
DROP TRIGGER IF EXISTS order_updated ON orders;
DROP TRIGGER IF EXISTS order_deleted ON orders;

-- Add triggers
CREATE TRIGGER order_created
AFTER INSERT ON orders
FOR EACH ROW EXECUTE FUNCTION notify_order_status();

CREATE TRIGGER order_updated
AFTER UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION notify_order_status();

CREATE TRIGGER order_deleted
AFTER DELETE ON orders
FOR EACH ROW EXECUTE FUNCTION notify_order_status();
