import { createClient } from '@supabase/supabase-js';
import { describe, it, expect, beforeAll } from 'vitest';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

describe('Auth System Setup', () => {
  let testUserId: string;

  beforeAll(async () => {
    // Clean up any existing test users
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', 'test@example.com')
      .single();

    if (existingUser) {
      await supabase.auth.admin.deleteUser(existingUser.id);
    }
  });

  it('should create a new user with correct profile', async () => {
    // Create test user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'test@example.com',
      password: 'testpassword123',
      email_confirm: true,
      user_metadata: {
        full_name: 'Test User'
      }
    });

    expect(authError).toBeNull();
    expect(authData.user).toBeDefined();
    testUserId = authData.user!.id;

    // Verify profile was created
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', testUserId)
      .single();

    expect(profileError).toBeNull();
    expect(profile).toBeDefined();
    expect(profile!.role).toBe('customer');
    expect(profile!.status).toBe('active');
  });

  it('should enforce role-based access control', async () => {
    // Try to access admin-only data as customer
    const { data: adminData, error: adminError } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'admin');

    expect(adminError).toBeDefined();
    expect(adminData).toBeNull();

    // Update to admin role
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', testUserId);

    expect(updateError).toBeNull();

    // Verify role update
    const { data: updatedProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', testUserId)
      .single();

    expect(updatedProfile!.role).toBe('admin');
  });

  it('should handle inactive status correctly', async () => {
    // Set user to inactive
    const { error: statusError } = await supabase
      .from('profiles')
      .update({ status: 'inactive' })
      .eq('id', testUserId);

    expect(statusError).toBeNull();

    // Verify status update
    const { data: profile } = await supabase
      .from('profiles')
      .select('status')
      .eq('id', testUserId)
      .single();

    expect(profile!.status).toBe('inactive');
  });

  it('should update user metadata properly', async () => {
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      testUserId,
      {
        user_metadata: {
          full_name: 'Updated Test User'
        }
      }
    );

    expect(updateError).toBeNull();

    // Verify user table was updated via trigger
    const { data: user } = await supabase
      .from('users')
      .select('name')
      .eq('id', testUserId)
      .single();

    expect(user!.name).toBe('Updated Test User');
  });

  it('should handle password reset flow', async () => {
    const { error: resetError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: 'test@example.com'
    });

    expect(resetError).toBeNull();
  });

  it('should clean up test data', async () => {
    // Delete test user
    const { error: deleteError } = await supabase.auth.admin.deleteUser(testUserId);
    expect(deleteError).toBeNull();

    // Verify cascade delete worked
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', testUserId)
      .single();

    expect(profile).toBeNull();
  });
});
