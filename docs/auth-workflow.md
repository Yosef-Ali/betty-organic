# Authentication Workflow Guide

Below is a concise overview of how the authentication system works in this application.

## 1. Sign Up Flow
- The user enters name, email, and password in SignupForm.
- SignupForm calls `signUp(email, password, name)` from `useAuthForm`.
- Supabase creates the user, storing `full_name` in user metadata.
- The user is then redirected or shown an error message.

## 2. Sign In Flow
1. The user supplies credentials in SignInForm.
2. `signIn(email, password)` from `useAuthForm` checks Supabase for valid credentials.
3. If valid, user session is created.
4. After successful sign-in, the AuthProvider queries the “profiles” table to see if role is “admin.”
   - If yes, user is allowed to `/dashboard` or any admin routes.
   - If not, an “Unauthorized” status is returned.

## 3. Magic Link & OAuth (Optional)
- SignInForm offers magic link sign-in (`signInWithOtp`) or Google sign-in (`signInWithOAuth`).
- Supabase handles redirects.
- On success, an authenticated session is established the same way as password sign-in.

## 4. Protected Routes
- “ProtectedRoute” checks:
  1. If `loading` is over and `user` is missing, redirect to /auth/signin.
  2. If `requireAdmin` is true but user is not admin, redirect to /unauthorized.

## 5. Auth Context
- “AuthProvider” uses `onAuthStateChange` to:
  - Set `user`.
  - Query “profiles” to detect if user is “admin.”
  - Provide `isAdmin` status to the app.

## 6. Putting It All Together
1. The user visits a protected route → AuthProvider and/or middleware verifies session/role.
2. If valid session and correct role, they can access the content.
3. If invalid session or insufficient role, they are redirected to Sign In or Unauthorized page.

## Additional Database Setup & RLS

Below SQL script sets up the profiles and users tables, creates row-level security policies, and adds triggers to handle new and updated users in Supabase:

```sql
-- Drop existing triggers first
DROP TRIGGER IF EXISTS trigger_add_user_on_sign_up ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop existing functions
DROP FUNCTION IF EXISTS public.add_user_on_sign_up();
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create or update profiles table (role can be 'admin', 'sales', or 'customer')
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    role TEXT CHECK (role in ('admin', 'sales', 'customer')) DEFAULT 'customer',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable row-level security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admin full access profiles" ON public.profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Create or update users table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    address TEXT,
    phone TEXT,
    avatar TEXT DEFAULT 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT email_check CHECK (email LIKE '%_@__%.__%')
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create the new-user function and trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id)
    VALUES (NEW.id);

    INSERT INTO public.users (
        id,
        email,
        name,
        avatar
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'avatar',
                 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png')
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Grant permissions
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Handle auth.user updates
CREATE OR REPLACE FUNCTION handle_auth_user_update()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.users
    SET
        email = NEW.email,
        updated_at = now()
    WHERE id = NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_updated
    AFTER UPDATE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_auth_user_update();
```

These changes ensure that new users automatically get entries in both “profiles” and “users.” The “profiles” table enforces user roles and RLS, while the “users” table stores additional custom fields. Admin privileges are handled via `profiles.role = 'admin'`.
