### Authentication System Architecture

1. **Authentication Actions and Utilities (app/actions/auth.ts):**
   - This file contains all the server actions related to authentication such as `signUp`, `signIn`, `signInWithGoogle`, and `signOut`.
   - The `getCurrentUser` function is used to fetch the current authenticated user and their associated profile from the database. This function caches the result to avoid repeated database queries.
   - Helper functions such as `isUserAdmin`, `isSalesUser`, and `isCustomerUser` are defined here to check the user's role.

2. **Middleware (middleware.ts):**
   - The `middleware.ts` file handles route protection and session management for the application.
   - It utilizes `createServerClient` from `@supabase/ssr` to create a Supabase client instance that handles cookie management.
   - For routes that start with `/dashboard`, the middleware checks if the user is authenticated. If not, it redirects them to the login page.
   - Additionally, for dashboard routes (except for `/dashboard/profile`), the middleware checks if the user has a role of either `admin` or `sales`. If not, it redirects them to the home page.
   - The `updateSession` function from `@/lib/supabase/middleware` is used to update the session if it has expired.

3. **Login Form (components/authentication/login-form.tsx):**
   - This component uses React Hook Form and Zod for form validation.
   - It handles form submission for email/password login and provides a button for Google sign-in.
   - Upon form submission, it calls `signIn` from `@/app/actions/auth` to authenticate the user.

4. **Sign-up Page (app/auth/signup/page.tsx):**
   - This page handles the sign-up process where users can sign up using an email and password.
   - It uses a `SignupForm` component (which is not shown here but likely defined elsewhere) and handles form submission by calling `signUp` from `@/app/actions/auth`.

5. **Callback Route (app/auth/callback/route.ts):**
   - Handles the OAuth callback for authentication providers such as Google.
   - It exchanges the authentication code for a session and updates the user's profile in the database if necessary.
   - For Google sign-ins, it sets the `sb-access-token` and `sb-refresh-token` cookies.

6. **Auth Client Utility (lib/supabase/client.ts):**
   - Provides a function to create a Supabase client for client-side usage.

7. **Auth Server Utility (lib/supabase/server.ts):**
   - Provides a function to create a Supabase client for server-side usage.

8. **Middleware Utility (lib/supabase/middleware.ts):**
   - Provides a function `updateSession` to update the session if it has expired.

9. **Database Types (lib/supabase/database.types.ts):**
   - Contains TypeScript types generated from the Supabase database schema.

10. **Profile and Auth Data Types (lib/types/auth.ts):**
    - Defines types for `AuthState`, `AuthError`, and `Profile` used throughout the auth system.

### Summary

The authentication system uses a combination of server actions, middleware, and client components to handle user sign-up, sign-in (including Google sign-in), session management, and route protection. The Supabase authentication library is used to manage the session state and handle OAuth callbacks. The `profiles` table in the Supabase database stores additional user information such as roles and statuses. The `middleware.ts` file is crucial for protecting routes based on user authentication status and roles.
