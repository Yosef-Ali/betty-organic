-- Verify admin role exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'admin') THEN
        CREATE ROLE admin;
    END IF;
END $$;

-- Ensure current user has admin role
DO $$
DECLARE
    current_user_id uuid := auth.uid();
BEGIN
    -- Check if user has admin role in profiles table
    IF NOT EXISTS (
        SELECT 1
        FROM profiles
        WHERE id = current_user_id
        AND role = 'admin'
    ) THEN
        -- Update user role to admin
        UPDATE profiles
        SET role = 'admin'
        WHERE id = current_user_id;
    END IF;
END $$;

-- Grant necessary permissions to admin role
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO admin;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO admin;

-- Apply RLS policies for admin access
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can access all profiles"
    ON profiles
    FOR ALL
    TO admin
    USING (true)
    WITH CHECK (true);
