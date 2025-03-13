# SQL Updates for Order ID System

Run these SQL commands in order, they're safe to run multiple times:

```sql
-- 1. Create or update tables
CREATE TABLE IF NOT EXISTS system_counters (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    counter_key VARCHAR(255) NOT NULL UNIQUE,
    counter_value INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Add display_id if it doesn't exist
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

-- Create index if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_system_counters_counter_key
ON system_counters(counter_key);

-- 2. Create or replace functions
CREATE OR REPLACE FUNCTION get_and_increment_counter(counter_key_param TEXT)
RETURNS INTEGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    current_value INTEGER;
BEGIN
    INSERT INTO system_counters (counter_key, counter_value)
    VALUES (counter_key_param, 1)
    ON CONFLICT (counter_key)
    DO UPDATE SET counter_value = system_counters.counter_value + 1
    RETURNING counter_value - 1 INTO current_value;

    RETURN current_value;
END;
$$;

CREATE OR REPLACE FUNCTION reset_counter(counter_key_param TEXT)
RETURNS VOID
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    IF NOT (SELECT is_admin(auth.uid())) THEN
        RAISE EXCEPTION 'Permission denied: Admin role required';
    END IF;

    INSERT INTO system_counters (counter_key, counter_value)
    VALUES (counter_key_param, 1)
    ON CONFLICT (counter_key)
    DO UPDATE SET counter_value = 1;
END;
$$;

-- 3. Ensure permissions (safe to run multiple times)
GRANT EXECUTE ON FUNCTION get_and_increment_counter(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION reset_counter(TEXT) TO authenticated;

-- Enable RLS
ALTER TABLE system_counters ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first to avoid conflicts
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
```

After running these commands:
1. Verify that the `system_counters` table exists and has the correct structure
2. Confirm the `orders` table has the `display_id` column
3. Check that both functions are available
4. Test creating a new order to ensure it gets a display_id in the format BO-YYYYMMDD-XXXX
