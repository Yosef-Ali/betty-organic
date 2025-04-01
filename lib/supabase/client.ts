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
            name: 'sb-session',  // Changed from 'sb-auth-token' to match Supabase default
            path: '/',
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 7, // 7 days
            partitioned: false  // Add this to fix potential partitioning issues
          },
          auth: {
            flowType: 'pkce',
            detectSessionInUrl: true,
            autoRefreshToken: true,
            persistSession: true,
            storageKey: 'sb-session',  // Make sure this matches the cookie name
            // New custom storage implementation that safely handles base64 cookies
            storage: {
              getItem: (key) => {
                try {
                  if (typeof window === 'undefined') return null;

                  // First try to get from localStorage
                  let item = window.localStorage.getItem(key);

                  // If not in localStorage, try to parse from cookies
                  if (!item) {
                    const cookies = document.cookie.split('; ');
                    for (const cookie of cookies) {
                      const [cookieName, cookieValue] = cookie.split('=');
                      if (cookieName === key || cookieName === `${key}`) {
                        // Handle base64-encoded JWT tokens - don't try to parse them as JSON
                        if (cookieValue && (cookieValue.startsWith('base64-') || cookieValue.includes('eyJ'))) {
                          return decodeURIComponent(cookieValue);
                        }
                        item = decodeURIComponent(cookieValue);
                        break;
                      }
                    }
                  }

                  // Return the item directly if it's a base64 string
                  if (item && (item.startsWith('base64-') || item.includes('eyJ'))) {
                    return item;
                  }

                  // Otherwise try to parse as JSON, but handle failures gracefully
                  try {
                    return item ? JSON.parse(item) : null;
                  } catch (e) {
                    // If JSON parsing fails, return the raw string
                    return item;
                  }
                } catch (error) {
                  console.warn('Error reading auth data:', error);
                  return null;
                }
              },
              setItem: (key, value) => {
                try {
                  if (typeof window === 'undefined') return;
                  window.localStorage.setItem(key, value);
                } catch (error) {
                  console.warn('Error writing to localStorage:', error);
                }
              },
              removeItem: (key) => {
                try {
                  if (typeof window === 'undefined') return;
                  window.localStorage.removeItem(key);

                  // Also clear from cookies if present
                  if (typeof document !== 'undefined') {
                    document.cookie = `${key}=; Max-Age=-1; path=/; SameSite=Lax; ${window.location.protocol === 'https:' ? 'Secure;' : ''
                      }`;
                    document.cookie = `${key}.refresh_token=; Max-Age=-1; path=/; SameSite=Lax; ${window.location.protocol === 'https:' ? 'Secure;' : ''
                      }`;
                  }
                } catch (error) {
                  console.warn('Error removing auth data:', error);
                }
              }
            }
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

                  // Determine if this is an auth request by converting URL to string first
                  let urlStr: string;
                  if (typeof url === 'string') {
                    urlStr = url;
                  } else if (url instanceof URL) {
                    urlStr = url.toString();
                  } else {
                    urlStr = url.url;
                  }
                  const isAuthRequest = urlStr.includes('/auth/');
                  const isRestRequest = urlStr.includes('/rest/v1/');

                  const response = await fetch(url, {
                    ...options,
                    cache: 'no-store',
                    signal: controller.signal,
                    credentials: isAuthRequest ? 'include' : 'same-origin', // Changed to same-origin for better cookie handling
                    headers: {
                      ...options.headers,
                      'Content-Type': 'application/json',
                      'Accept': 'application/json',
                      ...(isRestRequest ? {
                        'Access-Control-Request-Method': 'GET, POST, PUT, DELETE, OPTIONS',
                        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info, apikey',
                        'Access-Control-Expose-Headers': 'Content-Range'
                      } : {})
                    }
                  });

                  clear(); // Clear the timeout
                  return response;
                } catch (err) {
                  lastError = err as Error;
                  console.warn(`Supabase fetch error for ${url} (attempt ${attempt + 1}/${MAX_RETRIES}):`, err);
                }
              }

              throw lastError;
            }
          }
        }
      );
    } catch (error) {
      console.error('Error creating Supabase client:', error);
      throw error;
    }
  }

  return supabaseClient;
};

