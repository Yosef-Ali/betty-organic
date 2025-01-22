import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: async (name: string) => {
          const cookie = await cookieStore.get(name);
          return cookie?.value;
        },
        set: async (
          name: string,
          value: string,
          options: {
            path: string;
            domain?: string;
            maxAge?: number;
            httpOnly?: boolean;
            sameSite?: 'lax' | 'strict' | 'none';
            secure?: boolean;
          },
        ) => {
          await cookieStore.set(name, value, options);
        },
        remove: async (
          name: string,
          options: { path: string; domain?: string },
        ) => {
          await cookieStore.delete(name, options);
        },
      },
    },
  );

  return supabase;
}
