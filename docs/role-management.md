# Role Management System

## Authentication and Role Management Architecture

### Core Issue

Admin roles get reset because:

1. Google sign-in flow overwrites existing roles
2. Missing role validation during profile updates
3. No admin interface to manage roles

```typescript
if (!profile || !profile.role) {
  // Automatically sets role to 'customer'
  await supabase.from('profiles').upsert({
    id: user.id,
    email: user.email,
    role: 'customer', // This causes admin roles to be lost
  });
}
```

2. This means if a profile gets cleared or the role field becomes null for any reason, the system will automatically reset it to 'customer', even for existing admin users.

## Role System Design

The role system is designed with three levels:

- `admin`: Full system access including user management
- `sales`: Access to sales-related features including products
- `customer`: Limited to profile management only

These roles are enforced in two places:

1. **Route Access Rules** (`middleware.ts`):

   - Dashboard is accessible to all authenticated users
   - Each role has specific access:
     - Customers: Can only view and edit their profile
     - Sales: Can access products and sales features
     - Admin: Has full access to all features
   - Users are redirected to their profile if they try to access unauthorized pages

2. **Dynamic UI Rendering** (`components/Sidebar.tsx`):

   - Role-Based Navigation System:

     - Admin: Full navigation menu with all administrative controls
     - Sales: Product management and sales-related features
     - Customer: Profile management interface

   - Component Access Control:
     - Implements client-side route guards
     - Dynamically renders UI elements based on permissions
     - Maintains consistent state with server-side authorization

## Recommended Solution

1. **Fix Role Persistence**:

   - Modify `createGoogleUserProfile()` to preserve existing roles
   - Only set default role for new users

   ```typescript
   if (!profile) {
     // Only set customer role for new profiles
     await supabase.from('profiles').insert({
       id: user.id,
       email: user.email,
       role: 'customer',
     });
   } else if (!profile.role) {
     // For existing profiles with missing role, check previous role or escalate
     // Could log this scenario for admin review
     console.warn(`User ${user.id} had missing role`);
   }
   ```

2. **Add Role Management**:

   - Create admin interface for role management
   - Add role change audit logging
   - Implement role change confirmation workflow

3. **Add Role Validation**:
   - Add database constraints to ensure role field can't be null
   - Add role change validation middleware
   - Implement role change notifications

## Implementation Steps

1. Backup current user roles
2. Update `createGoogleUserProfile()` implementation
3. Add database constraints
4. Create role management interface
5. Add monitoring for role changes

These changes will prevent unexpected role changes while maintaining proper role-based access control.
