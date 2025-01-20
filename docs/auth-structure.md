# Authentication System Structure

```
betty-organic-app/
├── app/
│   ├── auth/
│   │   ├── actions/
│   │   │   └── authActions.ts     # Server actions
│   │   ├── login/
│   │   │   └── page.tsx          # Login page
│   │   ├── signup/
│   │   │   └── page.tsx          # Signup page
│   │   ├── reset/
│   │   │   └── page.tsx          # Password reset
│   │   └── callback/
│   │       └── route.ts          # OAuth handler
│   └── api/
│       ├── auth/
│       │   └── [...route].ts     # Auth API routes
│       └── profile/
│           └── route.ts          # Profile management
├── components/
│   ├── auth/
│   │   ├── login-form.tsx        # Login form
│   │   ├── signup-form.tsx       # Signup form
│   │   └── reset-form.tsx        # Reset form
│   └── ui/
│       └── loading.tsx           # Loading states
├── contexts/
│   └── auth/
│       └── AuthContext.tsx       # Auth provider
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # Browser client
│   │   ├── server.ts             # Server client
│   │   └── middleware.ts         # Auth middleware
│   ├── hooks/
│   │   └── useAuth.ts            # Auth hook
│   └── types/
│       └── auth.ts               # Type definitions
└── middleware.ts                 # Root middleware
```

## Key Components

### 1. Authentication Context
```typescript
interface AuthContextType {
  isAdmin: boolean;
  isSales: boolean;
  isCustomer: boolean;
  loading: boolean;
  profile: Profile | null;
  refreshProfile: () => Promise<void>;
}
```

Responsibilities:
- Global auth state
- Session management
- Profile updates
- Role validation
- Loading states

### 2. Middleware (lib/supabase/middleware.ts)
```typescript
export function createMiddleware(config: MiddlewareConfig) {
  return async function middleware(req: NextRequest) {
    // Session validation
    // Route protection
    // Role verification
    // Error handling
  }
}
```

### 3. Server Actions
```typescript
// app/auth/actions/authActions.ts
export async function login(formData: LoginFormType): Promise<AuthResponse>;
export async function signup(formData: FormData): Promise<AuthResponse>;
export async function resetPassword(formData: ResetFormType): Promise<AuthResponse>;
export async function signOut(): Promise<void>;
```

### 4. Database Schema
```sql
-- profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users,
    role TEXT CHECK (role in ('admin', 'sales', 'customer')),
    status TEXT CHECK (status in ('active', 'inactive')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- users table
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users,
    email TEXT UNIQUE,
    name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 5. Protected Routes
- `/dashboard/*`: Auth required
- `/api/*`: Valid session
- `/admin/*`: Admin role
- `/sales/*`: Sales role

### 6. Security Features
- Server-side auth
- Type safety
- Role-based access
- Session management
- Protected APIs
- RLS policies
