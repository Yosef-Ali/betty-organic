-- This migration explicitly defines the foreign key relationship between the 'orders' table and the 'customers' table.
-- It ensures that the 'orders' table has a foreign key 'customer_id' that correctly references the 'customers' table.

-- Create customers table with proper constraints
-- Profile table already exists with different schema
-- This migration only adds the foreign key relationship

-- Add foreign key constraint with explicit relationship
ALTER TABLE public.orders
ADD CONSTRAINT fk_orders_profiles
FOREIGN KEY (profile_id)
REFERENCES public.profiles(id)
ON DELETE SET NULL
DEFERRABLE INITIALLY DEFERRED;

-- Optionally, you might want to update the schema cache after applying the migration.
-- However, Supabase usually handles cache updates automatically.
-- If issues persist, consider refreshing the schema cache in the Supabase dashboard.
