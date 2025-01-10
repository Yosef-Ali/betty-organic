-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own data" ON public.users;
DROP POLICY IF EXISTS "Admin full access" ON public.users;
DROP POLICY IF EXISTS "Sales can view data" ON public.users;

-- Policy for users to view their own data
CREATE POLICY "Users can view own data"
ON public.users
FOR SELECT
USING (auth.uid() = id);

-- Policy for admin full access
CREATE POLICY "Admin full access"
ON public.users
FOR ALL
USING (auth.role() = 'admin');

-- Policy for sales to view user data
CREATE POLICY "Sales can view data"
ON public.users
FOR SELECT
USING (auth.role() = 'sales');
