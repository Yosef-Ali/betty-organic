# Authentication System Guide

This document outlines the implementation details of the authentication system using Supabase and Next.js.

## Key Components

### 1. Environment Variables
Required environment variables in `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Authentication Context
`contexts/auth/AuthContext.tsx` provides authentication state management:

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

Key features:
- Role-based access control
- Profile management
- Session persistence
- Automatic session refresh
- Loading state management

### 3. Middleware
`lib/supabase/middleware.ts` handles:
- Session validation
- Route protection
- Role-based access
- API authentication
- Error responses

Protected routes:
- `/dashboard/*`: Requires authentication
- `/api/*`: Requires valid session
- `/admin/*`: Requires admin role
- `/sales/*`: Requires sales role

### 4. Server Actions
`app/auth/actions/authActions.ts` implements authentication operations:

```typescript
export async function login(formData: LoginFormType): Promise<AuthResponse>;
export async function signup(formData: FormData): Promise<AuthResponse>;
export async function resetPassword(formData: ResetFormType): Promise<AuthResponse>;
export async function signOut(): Promise<void>;
```

### 5. Role-Based Access Control

Supported roles:
- Admin: Full system access
- Sales: Order management
- Customer: Basic access

Role enforcement:
- Database RLS policies
- Application middleware
- AuthContext checks
- API validation

### 6. Security Measures

1. Authentication:
   - Password hashing
   - Email verification
   - Session management
   - Secure password reset

2. Data Protection:
   - CSRF protection
   - Secure cookies
   - RLS policies
   - Session invalidation

3. Error Handling:
   - Type-safe errors
   - User messages
   - Session recovery
   - Rate limiting

### 7. Usage Examples

Using authentication context:
```typescript
const { isAdmin, profile, loading } = useAuthContext();

if (loading) return <LoadingSpinner />;
if (!profile) return <LoginRedirect />;
if (isAdmin) return <AdminDashboard />;
```

### 8. Troubleshooting

Common issues:

1. Session Issues:
   - Clear storage
   - Check env vars
   - Verify Supabase settings

2. Role Access:
   - Check profile data
   - Verify middleware
   - Review RLS policies

3. Auth Errors:
   - Validate input
   - Check network
   - Review logs

## Best Practices

1. Use server actions for auth
2. Implement error handling
3. Follow role-based access
4. Keep state in context
5. Use TypeScript
6. Secure sessions
