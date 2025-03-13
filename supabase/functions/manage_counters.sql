-- Function to safely get and increment counter
CREATE OR REPLACE FUNCTION get_and_increment_counter(counter_key_param TEXT)
RETURNS INTEGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    current_value INTEGER;
BEGIN
    -- Try to get existing counter or create new one
    INSERT INTO system_counters (counter_key, counter_value)
    VALUES (counter_key_param, 1)
    ON CONFLICT (counter_key)
    DO UPDATE SET counter_value = system_counters.counter_value + 1
    RETURNING counter_value - 1 INTO current_value;

    RETURN current_value;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_and_increment_counter(TEXT) TO authenticated;

-- Function to reset counter (admin only)
CREATE OR REPLACE FUNCTION reset_counter(counter_key_param TEXT)
RETURNS VOID
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    -- Verify admin role
    IF NOT (SELECT is_admin(auth.uid())) THEN
        RAISE EXCEPTION 'Permission denied: Admin role required';
    END IF;

    -- Reset counter
    INSERT INTO system_counters (counter_key, counter_value)
    VALUES (counter_key_param, 1)
    ON CONFLICT (counter_key)
    DO UPDATE SET counter_value = 1;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION reset_counter(TEXT) TO authenticated;
