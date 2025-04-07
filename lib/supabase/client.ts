import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

// Get the Supabase URL and key from environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Validate environment variables
if (!SUPABASE_URL) {
  throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_URL');
}

if (!SUPABASE_ANON_KEY) {
  throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

// Create a single supabase client for interacting with your database
export const supabase = createSupabaseClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 5 // Reduced from 10 to prevent rate limiting
    }
  },
  global: {
    fetch: fetch.bind(globalThis), // Explicitly bind fetch
    headers: { 'x-application-name': 'betty-organic-app' }
  },
  db: {
    schema: 'public'
  },
});

// Export a function to get the client for backward compatibility
export const createClient = () => supabase;

// Add a health check function to test connection
export const checkSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
    if (error) {
      console.error('Supabase connection error:', error);
      return { connected: false, error: error.message };
    }
    return { connected: true };
  } catch (err) {
    console.error('Supabase connection check failed:', err);
    return { connected: false, error: err instanceof Error ? err.message : 'Unknown connection error' };
  }
};
