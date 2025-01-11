'use server'

import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { Database } from '@/types/supabase'

export async function createServerSupabaseClient() {
  const cookieStore = await cookies()

  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
        storage: {
          getItem: async (key: string) => {
            const cookie = await cookieStore.get(key)
            return cookie?.value || null
          },
          setItem: async (key: string, value: string) => {
            await cookieStore.set(key, value, {
              path: '/',
              httpOnly: true,
              sameSite: 'lax',
              secure: process.env.NODE_ENV === 'production'
            })
          },
          removeItem: async (key: string) => {
            await cookieStore.delete(key)
          }
        }
      }
    }
  )
}
