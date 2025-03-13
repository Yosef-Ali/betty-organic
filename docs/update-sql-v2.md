# Updated SQL Migration for Order ID System

Run these SQL commands in sequence in your Supabase SQL Editor:

```sql
-- 1. Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 2. Create system_counters table with proper timestamp management
CREATE TABLE IF NOT EXISTS system_counters (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    counter_key VARCHAR(255) NOT NULL UNIQUE,
    counter_value INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 3. Add display_id to orders if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'orders'
        AND column_name = 'display_id'
    ) THEN
        ALTER TABLE orders ADD COLUMN display_id VARCHAR(20) UNIQUE;
    END IF;
END $$;

-- 4. Create trigger for updated_at
DROP TRIGGER IF EXISTS update_system_counters_updated_at ON system_counters;
CREATE TRIGGER update_system_counters_updated_at
    BEFORE UPDATE ON system_counters
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 5. Create counter management functions
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

-- 6. Create reset function (admin only)
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

-- 7. Setup permissions
-- Enable RLS
ALTER TABLE system_counters ENABLE ROW LEVEL SECURITY;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_and_increment_counter(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION reset_counter(TEXT) TO authenticated;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow authenticated users to read system_counters" ON system_counters;
DROP POLICY IF EXISTS "Allow authenticated users to insert system_counters" ON system_counters;
DROP POLICY IF EXISTS "Allow authenticated users to update system_counters" ON system_counters;

-- Create new policies
CREATE POLICY "Allow authenticated users to read system_counters"
    ON system_counters FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to insert system_counters"
    ON system_counters FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update system_counters"
    ON system_counters FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 8. Create index for performance
CREATE INDEX IF NOT EXISTS idx_system_counters_counter_key
ON system_counters(counter_key);

-- Test the setup
DO $$
BEGIN
    PERFORM get_and_increment_counter('test_counter');
    RAISE NOTICE 'Test counter created successfully';
END $$;
```

After running these commands, use the verification queries in `verify-setup.sql` to check if everything is working correctly.
