-- Create system_counters table for tracking sequential counters
CREATE TABLE system_counters (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    counter_key VARCHAR(255) NOT NULL UNIQUE,
    counter_value INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Add display_id column to orders table
ALTER TABLE orders ADD COLUMN display_id VARCHAR(20) UNIQUE;

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
CREATE INDEX idx_system_counters_counter_key ON system_counters(counter_key);

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
