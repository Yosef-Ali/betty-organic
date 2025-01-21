import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          try {
            const cookie = cookieStore.get(name);
            return cookie?.value;
          } catch {
            return '';
          }
        },
        set(name: string, value: string, options: CookieOptions) {
          // Don't set cookies for edge runtime
          if (process.env.NEXT_RUNTIME === 'edge') return;

          try {
            cookieStore.set({
              name,
              value,
              path: '/',
              ...options,
              // These are important for security
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
            });
          } catch (error) {
            console.error('Error setting cookie:', error);
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.delete({
              name,
              path: '/',
              ...options,
            });
          } catch (error) {
            console.error('Error removing cookie:', error);
          }
        },
      },
      auth: {
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true,
      },
    },
  );
}
