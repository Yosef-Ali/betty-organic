# Authentication Workflow Guide

Below is a comprehensive overview of how the authentication system works in this application.

## 1. Sign Up Flow
- User enters email and password through the login form
- Server action `signup()` is called with form data
- Supabase creates the user and initiates email verification
- User data is stored with default 'customer' role
- User is redirected to verification message or shown error

## 2. Sign In Flow
1. User submits credentials via login form
2. Server action `login()` validates credentials with Supabase
3. Upon successful authentication:
   - Session is created
   - Profile data is fetched from "profiles" table
   - User role (admin/sales/customer) is verified
   - Auth store is updated with profile data
4. User is redirected based on role and intended destination

## 3. Role-Based Access Flow
The system supports three roles:
- **Admin**: Full system access
- **Sales**: Order management access
- **Customer**: Basic user access

Role verification occurs at multiple levels:
1. Database level through RLS policies
2. Application level via AuthContext
3. API level through middleware checks
4. UI level through conditional rendering

## 4. Protected Routes & Authorization
- Middleware checks for valid session
- AuthContext provides role-based flags:
  - `isAdmin`
  - `isSales`
  - `isCustomer`
- Components use these flags for conditional rendering
- API routes validate permissions server-side

## 5. Auth Context Management
AuthContext handles:
- Session persistence
- Profile management
- Role-based access control
- Loading states
- Auto-refresh of sessions
- Local storage synchronization

## 6. Password Reset Flow
1. User initiates reset through reset form
2. Server action `resetPassword()` triggers reset email
3. User receives email with reset link
4. Link redirects to password update page
5. New password is saved and session updated

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

These SQL configurations ensure:
- Automatic user profile creation
- Role-based access control
- Proper data synchronization
- Secure row-level security policies
- Automated profile updates
