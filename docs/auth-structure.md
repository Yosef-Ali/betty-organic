betty-organic-app/
├── app/
│ ├── auth/
│ │ ├── login/
│ │ │ └── page.tsx
│ │ ├── signup/
│ │ │ └── page.tsx
│ │ └── ...existing code...
│ ├── layout.tsx
│ └── ...existing code...
├── components/
│ ├── authentication/
│ │ ├── auth-forms.tsx
│ │ ├── login-form.tsx
│ │ ├── signup-form.tsx
│ │ └── protected-route.tsx
│ └── ...existing code...
├── lib/
│ ├── contexts/
│ │ └── auth-context.tsx (Manages authentication state including user, role, and loading states)
│ │ ├── AuthContext (Provides user, role, isLoading, isAdmin, isSales)
│ │ ├── AuthProvider (Handles auth state management and profile fetching)
│ │ └── useAuth (Custom hook for accessing auth context)
│ ├── hooks/
│ │ └── useAuthForm.ts
│ └── ...existing code...
└── ...existing code...

Key Components:

1. AuthContext (lib/contexts/auth-context.tsx)

   - Manages global authentication state
   - Provides:
     - user: Current authenticated user
     - role: User role (admin, sales, customer)
     - isLoading: Loading state for auth operations
     - isAdmin: Boolean for admin role check
     - isSales: Boolean for sales role check

2. AuthProvider

   - Handles authentication state management
   - Manages user sessions with Supabase
   - Fetches and updates user profiles
   - Handles role-based redirections
   - Manages loading states during auth operations

3. Authentication Forms (components/authentication/)

   - login-form.tsx: Handles user login
   - signup-form.tsx: Handles user registration
   - protected-route.tsx: Route protection based on auth state

4. Auth Pages (app/auth/)
   - login/: User login page
   - signup/: User registration page
