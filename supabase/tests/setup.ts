import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../lib/types/supabase';

// Test environment validation
function validateEnv() {
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
  ];

  const missing = requiredEnvVars.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
        'Please ensure these are set in your test environment.',
    );
  }
}

// Initialize Supabase admin client for test cleanup
export function getAdminClient() {
  validateEnv();

  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use service role key for admin operations
  );
}

// Test utilities for auth operations
export async function cleanupTestUser(email: string) {
  const admin = getAdminClient();

  try {
    const { data: user } = await admin.auth.admin.listUsers({
      filter: { email },
    });

    if (user?.users?.[0]) {
      await admin.auth.admin.deleteUser(user.users[0].id);
    }
  } catch (error) {
    console.error('Error cleaning up test user:', error);
  }
}

// Helper to create test data
export function generateTestUser() {
  const timestamp = new Date().getTime();
  return {
    email: `test-${timestamp}@example.com`,
    password: 'Test123!@#',
    full_name: 'Test User',
  };
}

// Helper to validate profile data
export function validateProfile(profile: any) {
  const requiredFields = ['id', 'email', 'role', 'status'];
  const missing = requiredFields.filter(field => !profile[field]);

  if (missing.length > 0) {
    throw new Error(
      `Profile is missing required fields: ${missing.join(', ')}`,
    );
  }

  // Validate role
  if (!['admin', 'sales', 'customer'].includes(profile.role)) {
    throw new Error(`Invalid role: ${profile.role}`);
  }

  // Validate status
  if (!['active', 'inactive'].includes(profile.status)) {
    throw new Error(`Invalid status: ${profile.status}`);
  }

  return true;
}

// Jest setup
beforeAll(() => {
  validateEnv();
});

// Global teardown
afterAll(async () => {
  const admin = getAdminClient();
  await admin.auth.admin.listUsers(); // Keep connection alive for cleanup
});
