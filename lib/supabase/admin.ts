'use server';

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

// Admin client for server-side operations that need to bypass RLS
export async function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Missing Supabase environment variables for admin client');
  }

  // Create a Supabase client with the service role key
  // This bypasses Row Level Security
  return createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}
