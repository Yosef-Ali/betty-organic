# Authentication System Guide

This document outlines the implementation details of the authentication system using Supabase and Next.js.

## Key Components

### 1. Environment Variables
Required environment variables in `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-anon-key
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
}
```

Key features:
- Role-based access control
- Profile management
- Session persistence with localStorage
- Automatic session refresh
- Loading state management

### 3. Server Actions
`app/auth/actions/authActions.ts` implements authentication operations:

#### Login
```typescript
export async function login(formData: LoginFormType): Promise<AuthResponse<LoginResponse>> {
  // Handles password-based authentication
  // Updates profile data
  // Returns role-based redirect
}
```

#### Signup
```typescript
export async function signup(formData: FormData): Promise<AuthResponse> {
  // Handles user registration
  // Sets default role as 'customer'
  // Triggers email verification
}
```

#### Password Reset
```typescript
export async function resetPassword(formData: ResetFormType): Promise<AuthResponse> {
  // Initiates password reset flow
  // Sends reset instructions via email
}
```

#### Sign Out
```typescript
export async function signOut(): Promise<void> {
  // Clears session
  // Redirects to login
}
```

### 4. Role-Based Access Control

Supported roles:
- Admin: Full system access
- Sales: Order management capabilities
- Customer: Basic user permissions

Role enforcement:
- Database-level through RLS policies
- Application-level through AuthContext
- API-level through middleware checks

### 5. Security Measures

1. Authentication:
   - Password hashing (Supabase Auth)
   - Email verification required
   - Session-based authentication
   - Secure password reset flow

2. Data Protection:
   - CSRF protection
   - Secure cookie handling
   - Role-based access control
   - Session invalidation on logout

3. Error Handling:
   - Comprehensive error types
   - User-friendly error messages
   - Session expiration handling
   - Failed authentication recovery

### 6. Usage Examples

Using authentication context:
```typescript
const { isAdmin, profile, loading } = useAuthContext();

if (loading) {
  return <LoadingSpinner />;
}

if (!profile) {
  return <LoginRedirect />;
}

if (isAdmin) {
  return <AdminDashboard />;
}
```

Login form submission:
```typescript
const handleLogin = async (formData: LoginFormType) => {
  const response = await login(formData);

  if (response.success) {
    // Handle successful login
    router.push(response.redirectTo ?? '/');
  } else {
    // Handle error
    setError(response.error);
  }
};
```

### 7. Troubleshooting

Common issues and solutions:

1. Session Issues:
   - Clear browser storage
   - Verify environment variables
   - Check Supabase project settings

2. Role Access Problems:
   - Verify profile data in Supabase
   - Check AuthContext state
   - Review middleware configuration

3. Authentication Errors:
   - Validate form data
   - Check network requests
   - Review server logs
   - Verify email configuration

## Best Practices

1. Always use server actions for authentication operations
2. Implement proper error handling
3. Follow role-based access patterns
4. Keep authentication state in context
5. Use type-safe interfaces
6. Maintain secure session management
