'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
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

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    SUPABASE_URL as string,
    SUPABASE_ANON_KEY as string,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          try {
            // Only set cookies in server context
            cookieStore.set(name, value, {
              ...options,
              sameSite: 'lax',
              secure: process.env.NODE_ENV === 'production',
              maxAge: 60 * 60 * 24 * 7, // 7 days
              httpOnly: true, // Make all auth cookies httpOnly for security
              path: '/' // Ensure consistent path
            });
          } catch (error) {
            // Log but don't throw - allow graceful degradation
            console.error('Error setting cookie:', error);
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set(name, '', {
              ...options,
              maxAge: -1
            });
          } catch (error) {
            console.error('Error removing cookie:', error);
          }
        }
      }
    }
  );
}
