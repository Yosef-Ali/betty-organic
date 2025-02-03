-- Add foreign key constraint only (since column already exists)
ALTER TABLE orders
ADD CONSTRAINT orders_customer_profile_id_fkey
FOREIGN KEY (customer_profile_id)
REFERENCES profiles(id);

-- Update orders table relationships in database types
COMMENT ON CONSTRAINT orders_customer_profile_id_fkey ON orders IS
  E'@foreignKey (customer_profile_id) references profiles(id)\n@name orders_customer_profile_id_fkey';
