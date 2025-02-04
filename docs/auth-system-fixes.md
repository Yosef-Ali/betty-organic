# Authentication System Issues and Fixes

## Current Issues

### 1. Google Login Authentication Breaking

The system is currently experiencing issues with Google authentication due to inconsistent provider handling:

- The middleware (`middleware.ts`) correctly handles Google OAuth tokens
- However, the callback handler (`app/auth/callback/route.ts`) incorrectly overwrites the auth provider as 'email'
- This causes a disconnect in the authentication flow for Google users

### 2. User Role Persistence

User roles are not being preserved due to:

- The callback handler always setting role to 'customer'
- Existing user roles being overwritten on each authentication
- No provider-specific profile handling

## Required Fixes

### 1. Fix Google Authentication

1. Modify `app/auth/callback/route.ts` to properly handle different authentication providers:

```typescript
// Get the provider from the session
const {
  data: { session },
} = await supabase.auth.getSession();
const authProvider = session?.provider || 'email';

// Update profile with correct provider
const { error: profileError } = await supabase.from('profiles').upsert(
  {
    id: user.id,
    email: user.email,
    name: user.user_metadata?.full_name || user.email?.split('@')[0],
    role: 'customer', // Only set role for new users
    status: 'active',
    auth_provider: authProvider, // Use correct provider
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    onConflict: 'id',
    // Only update non-role fields
    ignoreDuplicates: false,
  },
);
```

### 2. Fix Role Persistence

1. Modify profile upsert in `app/auth/callback/route.ts` to preserve existing roles:

```typescript
// First check if profile exists
const { data: existingProfile } = await supabase
  .from('profiles')
  .select('role')
  .eq('id', user.id)
  .single();

// Only set default role for new users
const { error: profileError } = await supabase.from('profiles').upsert(
  {
    id: user.id,
    email: user.email,
    name: user.user_metadata?.full_name || user.email?.split('@')[0],
    role: existingProfile?.role || 'customer', // Preserve existing role
    status: 'active',
    auth_provider: authProvider,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    onConflict: 'id',
  },
);
```

## Implementation Notes

1. The fixes maintain backward compatibility with existing users
2. New users will still get the default 'customer' role
3. Existing users will maintain their roles through authentication cycles
4. Google OAuth flow will properly maintain provider information

## Testing Steps

After implementing the fixes:

1. Test Google Authentication:

   - Sign in with Google
   - Verify provider is correctly set in profiles table
   - Verify session maintains Google provider info

2. Test Role Persistence:

   - Create user with non-default role
   - Sign out and sign back in
   - Verify role remains unchanged
   - Test with both email and Google authentication

3. Test New User Flow:
   - Create new user
   - Verify default 'customer' role is set
   - Verify correct auth provider is set
