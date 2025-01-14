import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies'
import { Database } from '@/types/supabase'

export function createClient(cookieStore: ReadonlyRequestCookies) {
  const cookieOptions: CookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  }

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            // Cast cookieStore to any to bypass readonly restriction
            (cookieStore as any).set(name, value, { ...cookieOptions, ...options })
          } catch (error) {
            console.error(`Error setting cookie ${name}:`, error)
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            // Cast cookieStore to any to bypass readonly restriction
            (cookieStore as any).set(name, '', { ...cookieOptions, ...options })
          } catch (error) {
            console.error(`Error removing cookie ${name}:`, error)
          }
        }
      },
      auth: {
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true,
      },
    }
  )
}

export type AuthClient = ReturnType<typeof createClient>
