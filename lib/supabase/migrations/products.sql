-- Add created_by column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'products'
        AND column_name = 'created_by'
    ) THEN
        ALTER TABLE products
        ADD COLUMN created_by UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- Create category enum type if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type
        WHERE typname = 'product_category'
    ) THEN
        CREATE TYPE product_category AS ENUM (
            'All',
            'Spices_Oil_Tuna',
            'Flowers',
            'Vegetables',
            'Fruits',
            'Herbs_Lettuce',
            'Dry_Stocks_Bakery',
            'Eggs_Dairy_products'
        );
    END IF;
END $$;

-- Update category column to use enum type
ALTER TABLE products
ALTER COLUMN category TYPE product_category
USING category::product_category;

-- Update RLS policies for products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Sales can view products" ON products;
DROP POLICY IF EXISTS "Sales can manage own products" ON products;

-- Create new policies
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

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_products_created_by ON products(created_by);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
