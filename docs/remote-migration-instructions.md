# Remote Supabase Migration Instructions

Follow these steps in order to apply the database changes through the Supabase Dashboard:

1. Log in to your Supabase Dashboard
2. Go to your project
3. Navigate to the SQL Editor
4. Execute the following SQL blocks in order:

## 1. Create Tables and Columns

```sql
-- Create system_counters table for tracking sequential counters
CREATE TABLE IF NOT EXISTS system_counters (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    counter_key VARCHAR(255) NOT NULL UNIQUE,
    counter_value INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Add display_id column to orders table
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS display_id VARCHAR(20) UNIQUE;

-- Create index for counter_key for faster lookups
CREATE INDEX IF NOT EXISTS idx_system_counters_counter_key
ON system_counters(counter_key);
```

## 2. Create Helper Functions

```sql
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
```

## 3. Setup Permissions

```sql
-- Enable RLS for system_counters
ALTER TABLE system_counters ENABLE ROW LEVEL SECURITY;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_and_increment_counter(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION reset_counter(TEXT) TO authenticated;

-- Add RLS policies for system_counters
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

## 4. Verify Changes

After executing all SQL blocks, verify:
1. The `system_counters` table exists
2. The `orders` table has a `display_id` column
3. The functions `get_and_increment_counter` and `reset_counter` are created
4. RLS policies are in place for the `system_counters` table

## Testing

1. Create a new order through the application
2. Verify that the order gets a display_id in the format: BO-YYYYMMDD-XXXX
3. Create multiple orders to ensure sequential numbering works
4. Check that the display_id appears correctly in:
   - Order list
   - Order details
   - Order confirmation
   - Print/email receipts
