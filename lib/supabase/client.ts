import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/supabase';

let supabaseClient: ReturnType<typeof createBrowserClient<Database>> | null = null;
let retryCount = 0;
const MAX_RETRIES = 3;

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
          },
          global: {
            headers: {
              'Cache-Control': 'no-store, max-age=0',
            },
            fetch: (url, options) => {
              return fetch(url, {
                ...options,
                cache: 'no-store',
                signal: AbortSignal.timeout(10000) // 10-second timeout
              }).catch(err => {
                console.warn(`Supabase fetch error for ${url}:`, err);
                if (retryCount < MAX_RETRIES) {
                  retryCount++;
                  console.log(`Retrying (${retryCount}/${MAX_RETRIES})...`);
                  return fetch(url, {
                    ...options,
                    cache: 'no-store',
                    signal: AbortSignal.timeout(10000) // 10-second timeout
                  });
                }
                throw err;
              });
            }
          }
        }
      );
      
      // Reset retry counter after successful initialization
      retryCount = 0;
    } catch (error) {
      console.error('Failed to initialize Supabase client:', error);
      throw new Error('Failed to initialize Supabase client');
    }
  }
  return supabaseClient;
};
