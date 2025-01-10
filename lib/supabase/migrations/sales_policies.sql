-- Products table policies
DROP POLICY IF EXISTS "Sales can view products" ON products;
DROP POLICY IF EXISTS "Sales can manage own products" ON products;

CREATE POLICY "Sales can view products"
ON products
FOR SELECT
USING (
  auth.uid() IN (
    SELECT id FROM users WHERE role = 'sales'
  )
);

CREATE POLICY "Sales can manage own products"
ON products
FOR ALL
USING (
  auth.uid() IN (
    SELECT id FROM users WHERE role = 'sales'
  )
  AND created_by = auth.uid()
);

-- Orders table policies
DROP POLICY IF EXISTS "Sales can view orders" ON orders;
DROP POLICY IF EXISTS "Sales can manage own orders" ON orders;

CREATE POLICY "Sales can view orders"
ON orders
FOR SELECT
USING (
  auth.uid() IN (
    SELECT id FROM users WHERE role = 'sales'
  )
);

CREATE POLICY "Sales can manage own orders"
ON orders
FOR ALL
USING (
  auth.uid() IN (
    SELECT id FROM users WHERE role = 'sales'
  )
  AND sales_rep_id = auth.uid()
);

-- Add sales_rep_id column to products if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products'
    AND column_name = 'created_by'
  ) THEN
    ALTER TABLE products ADD COLUMN created_by UUID REFERENCES auth.users(id);
  END IF;
END $$;

-- Add sales_rep_id column to orders if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders'
    AND column_name = 'sales_rep_id'
  ) THEN
    ALTER TABLE orders ADD COLUMN sales_rep_id UUID REFERENCES auth.users(id);
  END IF;
END $$;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_products_created_by ON products(created_by);
CREATE INDEX IF NOT EXISTS idx_orders_sales_rep_id ON orders(sales_rep_id);
