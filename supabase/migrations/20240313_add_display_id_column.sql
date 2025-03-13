-- Add display_id column to orders table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'orders'
        AND column_name = 'display_id'
    ) THEN
        ALTER TABLE orders
        ADD COLUMN display_id VARCHAR(20) UNIQUE;
    END IF;
END $$;

-- Create index on display_id for better performance
CREATE INDEX IF NOT EXISTS idx_orders_display_id ON orders(display_id);

-- Add comment to the column
COMMENT ON COLUMN orders.display_id IS 'User-friendly order ID in format BO-YYYYMMDD-XXXX';
