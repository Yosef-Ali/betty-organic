import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import type { CookieOptionsWithName } from '@supabase/ssr';

// For use in app directory (Server Components)
export async function createClient() {
  const { cookies } = await import('next/headers');
  const cookieStore = cookies();

  // Ensure cookie store is initialized
  await new Promise(resolve => resolve(cookieStore));

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          const value = cookieStore.get(name)?.value;
          return value;
        },
        set(name: string, value: string, options: CookieOptionsWithName) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            console.error('Cookie set error:', error);
          }
        },
        remove(name: string, options: CookieOptionsWithName) {
          try {
            cookieStore.delete({ name, ...options });
          } catch (error) {
            console.error('Cookie remove error:', error);
          }
        },
      },
    },
  );
}

// For use in pages directory (Pages Router)
export function createPagesClient(req: any, res: any) {
  return createServerComponentClient({
    cookies: () => {
      const cookie = req.headers.cookie;
      return Object.fromEntries(
        cookie?.split(';').map(c => {
          const [key, ...v] = c.split('=');
          return [key?.trim(), v.join('=')];
        }) || [],
      );
    },
  });
}
