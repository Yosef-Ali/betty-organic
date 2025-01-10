-- Drop existing table and policies
DROP POLICY IF EXISTS "Users can view own data" ON public.users;
DROP POLICY IF EXISTS "Admin full access" ON public.users;
DROP POLICY IF EXISTS "Sales can view data" ON public.users;
DROP TABLE IF EXISTS public.users;

-- Create new users table with all required columns
CREATE TABLE public.users (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    email text UNIQUE NOT NULL,
    name text,
    full_name text,
    role text DEFAULT 'user',
    image_url text,
    status text DEFAULT 'active',
    last_active timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Recreate policies
CREATE POLICY "Users can view own data"
    ON public.users
    FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Admin full access"
    ON public.users
    FOR ALL
    USING (auth.uid() IN (
        SELECT id
        FROM public.users
        WHERE role = 'admin'
    ));

CREATE POLICY "Sales can view data"
    ON public.users
    FOR SELECT
    USING (auth.uid() IN (
        SELECT id
        FROM public.users
        WHERE role = 'sales'
    ));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);
CREATE INDEX IF NOT EXISTS users_role_idx ON users(role);
CREATE INDEX IF NOT EXISTS users_status_idx ON users(status);

-- Create trigger for updating updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
