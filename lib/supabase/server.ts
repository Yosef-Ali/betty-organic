'use server';

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/supabase';

export async function createClient() {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
      throw new Error('Database configuration error');
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
      throw new Error('Database configuration error');
    }

    return createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get(name: string) {
            return cookies().get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            cookies().set(name, value, {
              path: options.path ?? '/',
              secure: options.secure ?? true,
              sameSite: (options.sameSite as 'lax' | 'strict' | 'none') ?? 'lax',
              maxAge: options.maxAge ?? 0,
              httpOnly: options.httpOnly,
            });
          },
          remove(name: string, options: CookieOptions) {
            cookies().set(name, '', {
              path: options.path ?? '/',
              secure: options.secure ?? true,
              sameSite: (options.sameSite as 'lax' | 'strict' | 'none') ?? 'lax',
              maxAge: -1,
              httpOnly: options.httpOnly,
            });
          },
        },
      }
    );
  } catch (error) {
    console.error('Error creating Supabase client:', error);
    throw new Error('Failed to initialize database connection');
  }
}
