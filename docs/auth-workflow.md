# Authentication Workflows

This guide outlines the key authentication workflows in the application.

## 1. Sign Up Flow
1. User submits email/password via signup form
2. Server validates input and checks for existing user
3. Supabase creates user with 'customer' role
4. Verification email is sent
5. User data is stored in profiles/users tables
6. Redirect to verification message

## 2. Sign In Flow
1. User submits credentials
2. Server validates with Supabase
3. On success:
   - Create session
   - Fetch profile
   - Set role flags
   - Update auth store
4. Redirect based on role

## 3. Password Reset Flow
1. User requests reset
2. Server validates email
3. Reset email sent
4. User clicks reset link
5. Server verifies token
6. User sets new password
7. Session updated

## 4. Session Management

### Creation
1. User authenticates
2. Session token generated
3. Token stored securely
4. Profile data cached

### Validation
1. Middleware checks token
2. Verify expiration
3. Validate permissions
4. Update if needed

### Refresh
1. Monitor token expiry
2. Auto-refresh near expiry
3. Update stored token
4. Sync profile data

## 5. Role-Based Access

### Admin Flow
1. Check admin flag
2. Verify database role
3. Grant full access
4. Enable admin features

### Sales Flow
1. Check sales flag
2. Verify permissions
3. Grant order access
4. Show sales dashboard

### Customer Flow
1. Default role
2. Basic permissions
3. Limited features
4. Profile management

## 6. Error Handling

### Authentication Errors
1. Invalid credentials
2. Account locked
3. Email unverified
4. Session expired

### Authorization Errors
1. Invalid role
2. Missing permissions
3. Token expired
4. Invalid session

### Recovery Steps
1. Clear session
2. Redirect to login
3. Show error message
4. Log for monitoring

## 7. Security Measures

### Request Protection
1. CSRF tokens
2. Rate limiting
3. Input validation
4. Error sanitization

### Session Security
1. HTTP-only cookies
2. Secure flags
3. SameSite policy
4. XSS prevention

### Database Security
1. RLS policies
2. Prepared statements
3. Role validation
4. Audit logging
