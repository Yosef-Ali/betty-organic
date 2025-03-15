'use server';

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from './database.types';

export async function createClient() {
  try {
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          async get(name: string) {
            try {
              const cookieStore = await cookies();
              return cookieStore.get(name)?.value;
            } catch (error) {
              console.error('Error getting cookie:', error instanceof Error ? error.message : 'Unknown error');
              return undefined;
            }
          },
          async set(name: string, value: string, options: CookieOptions) {
            try {
              const cookieStore = await cookies();
              cookieStore.set(name, value, options);
            } catch (error) {
              console.error('Error setting cookie:', error instanceof Error ? error.message : 'Unknown error');
              throw new Error(`Failed to set authentication cookie: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
          },
          async remove(name: string, options: CookieOptions) {
            try {
              const cookieStore = await cookies();
              cookieStore.set(name, '', { ...options, maxAge: 0 });
            } catch (error) {
              console.error('Error removing cookie:', error instanceof Error ? error.message : 'Unknown error');
              throw new Error(`Failed to remove authentication cookie: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
          },
        },
      }
    );

    return supabase;
  } catch (error) {
    console.error('Error creating Supabase client:', error instanceof Error ? error.message : 'Unknown error');
    throw new Error('Failed to initialize Supabase client');
  }
}
