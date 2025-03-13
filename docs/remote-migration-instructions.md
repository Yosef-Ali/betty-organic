# Remote Supabase Migration Instructions

Follow these steps to apply the database changes through the Supabase Dashboard:

1. Log in to your Supabase Dashboard
2. Go to your project
3. Navigate to the SQL Editor
4. Create a new query and paste the following SQL:

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

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for system_counters
CREATE TRIGGER update_system_counters_updated_at
    BEFORE UPDATE ON system_counters
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create index for counter_key for faster lookups
CREATE INDEX IF NOT EXISTS idx_system_counters_counter_key
ON system_counters(counter_key);

-- Add RLS policies for system_counters
ALTER TABLE system_counters ENABLE ROW LEVEL SECURITY;

-- Only allow authenticated users to access system_counters
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

5. Execute the SQL query
6. Verify the changes:
   - Check if the `system_counters` table was created
   - Verify the `display_id` column was added to the orders table
   - Ensure the RLS policies are in place

The changes will take effect immediately after execution. All new orders will use the new display ID format (BO-YYYYMMDD-XXXX).
