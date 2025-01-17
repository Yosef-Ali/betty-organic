-- Drop existing tables and policies if they exist
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can insert own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can update own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view own order items" ON public.order_items;
DROP POLICY IF EXISTS "Users can insert own order items" ON public.order_items;
DROP POLICY IF EXISTS "Enable read access to all users" ON public.products;

DROP TABLE IF EXISTS public.order_items;
DROP TABLE IF EXISTS public.orders;
DROP TABLE IF EXISTS public.products;

-- Create products table
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  imageUrl TEXT,
  category TEXT,
  stock INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_by UUID,
  totalSales INTEGER DEFAULT 0,
  unit TEXT,
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ DEFAULT now()
);

-- Create orders table with UUID id
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  status TEXT NOT NULL,
  total_amount NUMERIC NOT NULL,
  type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  FOREIGN KEY (customer_id) REFERENCES auth.users (id) ON DELETE CASCADE
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL,
  product_id UUID NOT NULL,
  quantity INTEGER NOT NULL,
  price NUMERIC NOT NULL,
  product_name TEXT NOT NULL,
  FOREIGN KEY (order_id) REFERENCES public.orders (id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES public.products (id) ON DELETE RESTRICT
);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Products table policies - make products publicly readable
DROP POLICY IF EXISTS "Enable read access to all users" ON public.products;
CREATE POLICY "Enable read access to all users"
ON public.products
FOR SELECT
TO PUBLIC
USING (true);

-- Only allow product updates by authenticated users with specific roles (optional)
DROP POLICY IF EXISTS "Enable product updates for authenticated users" ON public.products;
CREATE POLICY "Enable product updates for authenticated users"
ON public.products
FOR UPDATE
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Orders table policies
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
CREATE POLICY "Users can view own orders"
ON public.orders
FOR SELECT
TO authenticated
USING (customer_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own orders" ON public.orders;
CREATE POLICY "Users can insert own orders"
ON public.orders
FOR INSERT
TO authenticated
WITH CHECK (customer_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own orders" ON public.orders;
CREATE POLICY "Users can update own orders"
ON public.orders
FOR UPDATE
TO authenticated
USING (customer_id = auth.uid())
WITH CHECK (customer_id = auth.uid());

-- Order items table policies
DROP POLICY IF EXISTS "Users can view own order items" ON public.order_items;
CREATE POLICY "Users can view own order items"
ON public.order_items
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE id = order_items.order_id
    AND customer_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can insert own order items" ON public.order_items;
CREATE POLICY "Users can insert own order items"
ON public.order_items
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE id = order_items.order_id
    AND customer_id = auth.uid()
  )
);

-- Insert sample products
INSERT INTO public.products (id, name, description, price, imageUrl, category, stock, active, unit, totalSales, createdAt, updatedAt)
VALUES
  (gen_random_uuid(), 'Fresh Mango', 'Sweet and juicy Ethiopian mangoes, perfect for smoothies and desserts', 120.00, '/fruits/mango.jpg', 'Fruits', 100, true, 'kg', 0, now(), now()),
  (gen_random_uuid(), 'Organic Banana', 'Fresh organic bananas from Ethiopian highlands', 45.00, '/fruits/banana.jpg', 'Fruits', 150, true, 'kg', 0, now(), now()),
  (gen_random_uuid(), 'Avocado', 'Creamy and rich Ethiopian avocados', 85.00, '/fruits/avocado.jpg', 'Fruits', 75, true, 'piece', 0, now(), now()),
  (gen_random_uuid(), 'Papaya', 'Sweet and nutritious Ethiopian papaya', 95.00, '/fruits/papaya.jpg', 'Fruits', 50, true, 'kg', 0, now(), now()),
  (gen_random_uuid(), 'Orange', 'Fresh and juicy Ethiopian oranges', 65.00, '/fruits/orange.jpg', 'Fruits', 200, true, 'kg', 0, now(), now()),
  (gen_random_uuid(), 'Apple', 'Crisp and sweet Ethiopian apples', 75.00, '/fruits/apple.jpg', 'Fruits', 120, true, 'kg', 0, now(), now()),
  (gen_random_uuid(), 'Pineapple', 'Sweet and tropical Ethiopian pineapples', 110.00, '/fruits/pineapple.jpg', 'Fruits', 60, true, 'piece', 0, now(), now()),
  (gen_random_uuid(), 'Watermelon', 'Refreshing Ethiopian watermelon', 130.00, '/fruits/watermelon.jpg', 'Fruits', 40, true, 'piece', 0, now(), now()),
  (gen_random_uuid(), 'Lemon', 'Fresh Ethiopian lemons', 35.00, '/fruits/lemon.jpg', 'Fruits', 180, true, 'kg', 0, now(), now()),
  (gen_random_uuid(), 'Guava', 'Sweet and aromatic Ethiopian guava', 70.00, '/fruits/guava.jpg', 'Fruits', 90, true, 'kg', 0, now(), now());
