-- Create is_admin function
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean AS $$
DECLARE
    user_role text;
BEGIN
    SELECT role INTO user_role
    FROM public.profiles
    WHERE id = user_id;

    RETURN user_role = 'admin';
END;
$$ LANGUAGE plpgsql;

-- Create testimonials table
CREATE TABLE testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  author TEXT NOT NULL,
  role TEXT NOT NULL,
  approved BOOLEAN DEFAULT false,
  image_url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

-- Security policies
CREATE POLICY "Admins can manage testimonials" ON testimonials
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Public read access" ON testimonials
  FOR SELECT USING (approved = true);
