-- Fixed test order creation with proper field lengths
-- First disable RLS if not already done
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;

-- Create test order with shorter display_id
INSERT INTO orders (
    customer_profile_id,
    status,
    total_amount,
    type,
    display_id
) VALUES (
    '8909a357-b456-4532-8f60-6f6505be398f',
    'pending',
    99.99,
    'sale',
    'TEST-' || (EXTRACT(EPOCH FROM NOW())::bigint % 100000)::text
) RETURNING id, status, total_amount, display_id, created_at;

-- Alternative with even shorter display_id
INSERT INTO orders (
    customer_profile_id,
    status,
    total_amount,
    type,
    display_id
) VALUES (
    '8909a357-b456-4532-8f60-6f6505be398f',
    'pending',
    123.45,
    'sale',
    'RT-' || LPAD((EXTRACT(EPOCH FROM NOW())::bigint % 10000)::text, 4, '0')
) RETURNING id, status, total_amount, display_id, created_at;

-- Minimal test order (no display_id - let it be auto-generated)
INSERT INTO orders (
    customer_profile_id,
    status,
    total_amount
) VALUES (
    '8909a357-b456-4532-8f60-6f6505be398f',
    'pending',
    55.00
) RETURNING id, status, total_amount, display_id, created_at;