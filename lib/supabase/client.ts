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
          },
          global: {
            headers: {
              'Cache-Control': 'no-store, max-age=0',
            },
            // Custom fetch implementation with retries
            fetch: async (url, options = {}) => {
              const MAX_RETRIES = 3;
              let lastError: Error | null = null;

              // Create a proper timeout controller for better browser support
              const createTimeoutController = (timeoutMs: number) => {
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), timeoutMs);
                return {
                  controller,
                  clear: () => clearTimeout(timeout)
                };
              };

              // Try the request up to MAX_RETRIES times
              for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
                try {
                  const { controller, clear } = createTimeoutController(10000); // 10s timeout

                  const response = await fetch(url, {
                    ...options,
                    cache: 'no-store',
                    signal: controller.signal,
                  });

                  clear(); // Clear the timeout
                  return response;
                } catch (err) {
                  lastError = err as Error;
                  console.warn(`Supabase fetch error for ${url} (attempt ${attempt + 1}/${MAX_RETRIES}):`, err);

                  // Don't wait on the last attempt
                  if (attempt < MAX_RETRIES - 1) {
                    // Exponential backoff with jitter
                    const backoffMs = Math.min(1000 * Math.pow(2, attempt), 5000) + Math.random() * 1000;
                    console.log(`Retrying in ${Math.round(backoffMs)}ms...`);
                    await new Promise(resolve => setTimeout(resolve, backoffMs));
                  }
                }
              }

              // If we get here, all retry attempts failed
              throw lastError || new Error('Request failed after multiple attempts');
            }
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
