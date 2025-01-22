require('dotenv').config({ path: '.env.test' });

const { createClient } = require('@supabase/supabase-js');

module.exports = async function globalSetup() {
  // Validate test environment
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
  ];

  const missing = requiredEnvVars.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
        'Create a .env.test file with these variables for testing.',
    );
  }

  // Verify Supabase connection
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    );

    const { error } = await supabase.auth.admin.listUsers({
      perPage: 1,
    });

    if (error) {
      throw error;
    }

    console.log('✓ Successfully connected to Supabase');
  } catch (error) {
    console.error('Failed to connect to Supabase:', error.message);
    throw error;
  }

  // Optional: Add delay to ensure DB is ready
  if (process.env.DEBUG === 'true') {
    console.log('Waiting for database to be ready...');
  }
  await new Promise(resolve => setTimeout(resolve, 1000));

  global.__SUPABASE_SETUP_COMPLETE__ = true;
};
