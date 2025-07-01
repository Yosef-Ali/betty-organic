-- Add guest information columns to orders table
-- This will help us distinguish guest orders and store their info

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS guest_name TEXT,
ADD COLUMN IF NOT EXISTS guest_email TEXT,
ADD COLUMN IF NOT EXISTS guest_phone TEXT,
ADD COLUMN IF NOT EXISTS guest_address TEXT,
ADD COLUMN IF NOT EXISTS is_guest_order BOOLEAN DEFAULT FALSE;

-- Add an index for faster guest order queries
CREATE INDEX IF NOT EXISTS idx_orders_is_guest ON public.orders(is_guest_order);
CREATE INDEX IF NOT EXISTS idx_orders_guest_email ON public.orders(guest_email);

-- Check the updated structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'orders' AND table_schema = 'public'
AND column_name LIKE '%guest%'
ORDER BY ordinal_position;

SELECT 'Guest info columns added to orders table' as status;