import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { Database } from '@/types/supabase'

export async function createServerSupabaseClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storage: {
          getItem: async (key: string) => {
            const cookieStore = await cookies()
            const cookie = cookieStore.get(key)
            return cookie?.value || null
          },
          setItem: async (key: string, value: string) => {
            const cookieStore = await cookies()
            cookieStore.set(key, value, {
              path: '/',
              httpOnly: true,
              sameSite: 'lax',
              secure: process.env.NODE_ENV === 'production'
            })
          },
          removeItem: async (key: string) => {
            const cookieStore = await cookies()
            cookieStore.delete(key)
          }
        }
      }
    }
  )
}
