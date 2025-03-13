import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

let supabaseClient: ReturnType<typeof createSupabaseClient<Database>> | null = null;
let retryCount = 0;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

export const createClient = () => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('Missing Supabase environment variables');
  }

  if (!supabaseClient) {
    try {
      supabaseClient = createSupabaseClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      );
    } catch (error) {
      console.error('Failed to initialize Supabase client:', error);
      throw new Error('Failed to initialize Supabase client');
    }
  }
  return supabaseClient;
};
