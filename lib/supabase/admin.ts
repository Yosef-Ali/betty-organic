// This file contains the Supabase admin client that can bypass Row-Level Security
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

/**
 * Creates a Supabase admin client that can bypass Row-Level Security
 * This function directly uses environment variables to avoid issues with Next.js
 */
export function createAdminClient() {
  // Access environment variables directly
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error('[Admin Client] Missing environment variable: NEXT_PUBLIC_SUPABASE_URL');
  }

  if (!supabaseServiceKey) {
    throw new Error('[Admin Client] Missing environment variable: SUPABASE_SERVICE_ROLE_KEY');
  }

  // Create a fresh client each time to avoid stale connections
  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    }
  });
}

// Export a static instance for backward compatibility, but using the function is preferred
export const supabaseAdmin = createAdminClient();
