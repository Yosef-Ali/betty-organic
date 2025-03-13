-- Function to get and increment a counter atomically
CREATE OR REPLACE FUNCTION get_and_increment_counter(counter_key_param TEXT)
RETURNS INTEGER AS $$
DECLARE
    current_value INTEGER;
BEGIN
    -- First try to update existing counter
    UPDATE system_counters
    SET counter_value = counter_value + 1,
        updated_at = TIMEZONE('utc', NOW())
    WHERE counter_key = counter_key_param
    RETURNING counter_value INTO current_value;

    -- If no row was updated (counter doesn't exist yet), insert new row
    IF current_value IS NULL THEN
        INSERT INTO system_counters(counter_key, counter_value)
        VALUES(counter_key_param, 1)
        ON CONFLICT (counter_key) DO UPDATE
        SET counter_value = system_counters.counter_value + 1
        RETURNING counter_value INTO current_value;
    END IF;

    RETURN current_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset counter to 1 (admin only)
CREATE OR REPLACE FUNCTION reset_counter(counter_key_param TEXT)
RETURNS VOID AS $$
BEGIN
    -- Reset counter to 1
    UPDATE system_counters
    SET counter_value = 1,
        updated_at = TIMEZONE('utc', NOW())
    WHERE counter_key = counter_key_param;

    -- If counter doesn't exist, create it
    IF NOT FOUND THEN
        INSERT INTO system_counters(counter_key, counter_value)
        VALUES(counter_key_param, 1)
        ON CONFLICT (counter_key) DO NOTHING;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions for authenticated users to call these functions
GRANT EXECUTE ON FUNCTION get_and_increment_counter(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION reset_counter(TEXT) TO authenticated;
