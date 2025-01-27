'use server';

import { createServerClient } from '@supabase/ssr';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// For use in app directory (Server Components and Server Actions)
export async function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: { path: string }) {
          cookieStore.set(name, value, options);
        },
        remove(name: string, options: { path: string }) {
          cookieStore.set(name, '', { ...options, maxAge: 0 });
        },
      },
    },
  );
}

// For use in pages directory (Pages Router)
export async function createPagesClient(req: any, res: any) {
  const cookies = () => {
    const cookie = req.headers.cookie;
    return Object.fromEntries(
      cookie?.split(';').map(c => {
        const [key, ...v] = c.split('=');
        return [key?.trim(), v.join('=')];
      }) || [],
    );
  };

  return createServerComponentClient({
    cookies,
  });
}
