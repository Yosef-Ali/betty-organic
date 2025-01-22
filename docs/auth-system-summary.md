# Auth System Overview

## Architecture

### Core Components

1. **Server-Side Auth** (`lib/supabase/`)

- `authActions.ts`: Server-side auth operations
- `client.ts`: Supabase client configuration
- `server.ts`: Server-side client utilities
- `middleware.ts`: Route protection and session handling

2. **Client-Side Auth** (`contexts/auth/`)

- `AuthContext.tsx`: Global auth state management
- `useAuth.ts`: Custom auth hook
- `types/auth.ts`: Type definitions

3. **Database** (`supabase/migrations/`)

- `20240120_update_auth_system.sql`: Auth tables and policies
- Row Level Security (RLS) implementation
- Automated profile management

### Authentication Flows

1. **Sign Up**

- Form validation with Zod
- Email verification
- Automatic profile creation
- Role assignment

2. **Sign In**

- Credential validation
- Session management
- Redirect handling

3. **Password Reset**

- Request flow
- Email verification
- Password update

4. **Protected Routes**

- Role-based access control
- Session verification
- Redirect handling

## Testing Infrastructure

1. **Unit Tests**

- Auth actions
- Hook behavior
- Form validation

2. **Integration Tests**

- Full auth flows
- RLS policies
- Error handling

3. **Test Utilities**

- Setup helpers
- Cleanup functions
- Type checking

### Running Tests

```bash
# Verify setup
npm run verify-auth

# Run test suite
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

## Type System

1. **Database Types** (`lib/types/supabase.ts`)

- Table definitions
- Row types
- RLS interfaces

2. **Auth Types** (`lib/types/auth.ts`)

- User profiles
- Auth states
- Form data

3. **API Types**

- Request/Response types
- Error handling
- Session management

## Security Features

1. **Row Level Security**

- Profile access control
- Role-based permissions
- Session validation

2. **Password Security**

- Strong password requirements
- Secure reset flow
- Hash verification

3. **Session Management**

- Secure cookie handling
- Token refresh
- Automatic cleanup

## Setup Instructions

1. **Environment Configuration**

```bash
# Development
cp .env.example .env.local
# Testing
npm run setup-test-env
```

2. **Database Setup**

```bash
# Apply migrations
npm run migrate
```

3. **Verify Installation**

```bash
npm run verify-auth
```

## Maintenance

### Adding New Features

1. Update types in `lib/types/`
2. Add migrations if needed
3. Implement server-side actions
4. Update client components
5. Add tests

### Troubleshooting

- Check auth-guide.md for common issues
- Verify environment variables
- Review test output
- Check Supabase logs

## Dependencies

### Production

- @supabase/ssr
- @supabase/supabase-js
- zod
- react-hook-form

### Development

- jest
- ts-jest
- tsx
- typescript

## Version Information

- Version: 0.1.0
- Last Updated: January 2024
- Tested with Next.js 14.1.0
