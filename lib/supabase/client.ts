import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/supabase';

let supabaseClient: ReturnType<typeof createBrowserClient<Database>> | null = null;

export const createClient = () => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('Missing Supabase environment variables');
  }

  if (!supabaseClient) {
    try {
      supabaseClient = createBrowserClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
          cookieOptions: {
            name: 'sb-auth-token',
            path: '/',
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 7 // 7 days
          },
          auth: {
            flowType: 'pkce',
            detectSessionInUrl: true,
            autoRefreshToken: true,
            persistSession: true
          }
        }
      );
    } catch (error) {
      console.error('Failed to initialize Supabase client:', error);
      throw new Error('Failed to initialize Supabase client');
    }
  }
  return supabaseClient;
};
