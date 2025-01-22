#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../lib/types/supabase';
import { cleanupTestUser, generateTestUser } from './setup';
import { loginAction, signupAction } from '../../lib/supabase/authActions';

async function verifySetup() {
  console.log('\nVerifying auth system setup...\n');

  try {
    // 1. Check environment variables
    const requiredEnvVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
    ];

    requiredEnvVars.forEach(key => {
      if (!process.env[key]) {
        throw new Error(`Missing ${key}`);
      }
      console.log(`✓ ${key} is set`);
    });

    // 2. Test Supabase connection
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    console.log('✓ Supabase connection successful');

    // 3. Test profile table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);

    if (profileError) {
      if (profileError.message.includes('does not exist')) {
        throw new Error('Profiles table not found. Run migrations first.');
      }
      throw profileError;
    }
    console.log('✓ Profiles table exists');

    // 4. Test auth flow
    const testUser = generateTestUser();

    // Signup
    const signupResult = await signupAction({
      ...testUser,
      confirmPassword: testUser.password,
    });
    if (signupResult.error) throw new Error(signupResult.error);
    console.log('✓ Signup successful');

    // Login
    const loginResult = await loginAction({
      email: testUser.email,
      password: testUser.password,
    });
    if (loginResult.error) throw new Error(loginResult.error);
    console.log('✓ Login successful');

    // Cleanup
    await cleanupTestUser(testUser.email);
    console.log('✓ Test user cleanup successful');

    console.log('\n✨ Auth system verification complete! All checks passed.\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Verification failed:', error.message);
    console.error('\nTroubleshooting steps:');
    console.error('1. Ensure .env.test is properly configured');
    console.error('2. Run migrations: cd supabase && supabase db push');
    console.error('3. Check Supabase project settings');
    console.error('4. Review auth-guide.md for setup instructions\n');
    process.exit(1);
  }
}

verifySetup();
