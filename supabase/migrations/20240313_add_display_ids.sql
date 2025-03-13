-- Function to generate display IDs for existing orders
CREATE OR REPLACE FUNCTION generate_display_ids()
RETURNS void AS $$
DECLARE
    order_record RECORD;
    date_str TEXT;
    sequence_num INTEGER;
BEGIN
    -- Create a temporary table to store the sequence numbers per date
    CREATE TEMP TABLE order_sequences (
        order_date DATE,
        sequence INTEGER
    );

    -- Initialize sequences for each date
    INSERT INTO order_sequences (order_date, sequence)
    SELECT DATE(created_at), 0
    FROM orders
    GROUP BY DATE(created_at);

    -- Update orders with display IDs
    FOR order_record IN
        SELECT id, created_at
        FROM orders
        WHERE display_id IS NULL
        ORDER BY created_at
    LOOP
        date_str := TO_CHAR(order_record.created_at, 'YYYYMMDD');

        -- Get and increment sequence for this date
        SELECT sequence + 1 INTO sequence_num
        FROM order_sequences
        WHERE order_date = DATE(order_record.created_at)
        RETURNING sequence + 1;

        UPDATE order_sequences
        SET sequence = sequence_num
        WHERE order_date = DATE(order_record.created_at);

        -- Update the order with the new display ID
        UPDATE orders
        SET display_id = 'BO-' || date_str || '-' || LPAD(sequence_num::TEXT, 4, '0')
        WHERE id = order_record.id;
    END LOOP;

    DROP TABLE order_sequences;
END;
$$ LANGUAGE plpgsql;

-- Execute the function
SELECT generate_display_ids();

-- Drop the function after use
DROP FUNCTION generate_display_ids();
