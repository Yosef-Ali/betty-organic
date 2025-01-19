# Authentication System Structure

```
betty-organic-app/
├── app/
│   ├── auth/
│   │   ├── actions/
│   │   │   └── authActions.ts (Server actions for auth operations)
│   │   ├── login/
│   │   │   └── page.tsx (Login page)
│   │   └── callback/
│   │       └── route.ts (OAuth callback handler)
│   └── layout.tsx
├── components/
│   ├── authentication/
│   │   └── login-form.tsx (Login form component with validation)
├── contexts/
│   └── auth/
│       └── AuthContext.tsx (Authentication context provider)
├── lib/
│   ├── supabase/
│   │   ├── client.ts (Supabase client configuration)
│   │   └── server.ts (Server-side Supabase client)
│   └── types/
│       └── auth.ts (Authentication type definitions)
└── types/
    └── supabase.ts (Supabase type definitions)
```

## Key Components

### 1. Authentication Context (contexts/auth/AuthContext.tsx)
- Manages global authentication state
- Provides:
  ```typescript
  interface AuthContextType {
    isAdmin: boolean;
    isSales: boolean;
    isCustomer: boolean;
    loading: boolean;
    profile: Profile | null;
  }
  ```
- Handles:
  - Session persistence
  - Profile management
  - Role-based access control
  - Loading states

### 2. Server Actions (app/auth/actions/authActions.ts)
```typescript
export async function login(formData: LoginFormType): Promise<AuthResponse>
export async function signup(formData: FormData): Promise<AuthResponse>
export async function resetPassword(formData: ResetFormType): Promise<AuthResponse>
export async function signOut(): Promise<void>
```
- Handles all authentication operations
- Manages user sessions
- Handles role assignment
- Processes form submissions

### 3. Login Form (components/authentication/login-form.tsx)
- Client-side form component
- Form validation using Zod
- Error handling
- Loading states
- Submission handling

### 4. Auth Pages (app/auth/)
- login/: User authentication
- callback/: OAuth handling
- Protected routes managed by middleware

### 5. Database Structure
```sql
public.profiles (
    id UUID PRIMARY KEY,
    role TEXT CHECK (role in ('admin', 'sales', 'customer')),
    status TEXT CHECK (status in ('active', 'inactive')),
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
)

public.users (
    id UUID PRIMARY KEY,
    email TEXT UNIQUE,
    name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
)
```

## Authentication Flow

1. User submits credentials via login-form.tsx
2. authActions.ts processes the request server-side
3. AuthContext updates with new session/profile
4. Middleware enforces route protection
5. Components render based on user role

## Security Features

- Server-side authentication logic
- Type-safe operations
- Role-based access control
- Secure session management
- Protected API routes
- Database-level security policies
