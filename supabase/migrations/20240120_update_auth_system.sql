-- Create login_attempts table for rate limiting
CREATE TABLE IF NOT EXISTS login_attempts (
    id BIGSERIAL PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON login_attempts(email);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE TRIGGER update_login_attempts_updated_at
    BEFORE UPDATE ON login_attempts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Update profiles table
ALTER TABLE profiles
    ADD COLUMN IF NOT EXISTS status TEXT CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
    ADD COLUMN IF NOT EXISTS role TEXT CHECK (role IN ('admin', 'sales', 'customer')) DEFAULT 'customer',
    ADD COLUMN IF NOT EXISTS auth_provider TEXT,
    ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS login_count INTEGER DEFAULT 0;

-- Add RLS policies for login_attempts
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read of own login attempts"
    ON login_attempts FOR SELECT
    USING (auth.email() = email);

CREATE POLICY "Allow internal services to manage login attempts"
    ON login_attempts FOR ALL
    USING (auth.role() = 'service_role');

-- Add RLS policies for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to read their own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Allow users to update their own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (
        -- Prevent users from changing their role or status
        (NEW.role = OLD.role) AND
        (NEW.status = OLD.status)
    );

CREATE POLICY "Allow admins to manage all profiles"
    ON profiles FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

-- Function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (
        id,
        email,
        name,
        role,
        status,
        auth_provider,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'role', 'customer'),
        COALESCE(NEW.raw_user_meta_data->>'status', 'active'),
        NEW.raw_user_meta_data->>'provider',
        NEW.created_at,
        NEW.created_at
    );
    RETURN NEW;
END;
$$ language plpgsql security definer;

-- Trigger for auto-creating profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update last_login and login_count
CREATE OR REPLACE FUNCTION public.handle_user_login()
RETURNS trigger AS $$
BEGIN
    UPDATE public.profiles
    SET
        last_login = NOW(),
        login_count = login_count + 1
    WHERE id = NEW.id;
    RETURN NEW;
END;
$$ language plpgsql security definer;

-- Trigger for updating login stats
DROP TRIGGER IF EXISTS on_auth_user_login ON auth.sessions;
CREATE TRIGGER on_auth_user_login
    AFTER INSERT ON auth.sessions
    FOR EACH ROW EXECUTE FUNCTION public.handle_user_login();
