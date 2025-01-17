-- First, drop the existing foreign key constraint
ALTER TABLE orders DROP CONSTRAINT IF EXISTS fk_customer;

-- Add the new foreign key constraint to reference profiles table
ALTER TABLE orders 
ADD CONSTRAINT fk_customer 
FOREIGN KEY (customer_id) 
REFERENCES profiles(id);
