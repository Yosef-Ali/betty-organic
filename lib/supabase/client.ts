import { createBrowserClient } from '@supabase/ssr'
import { Database } from './database.types'

const supabaseClient = createBrowserClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true,
      storageKey: 'sb-auth-token',
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      storage: {
        getItem: (key: string) => {
          try {
            return localStorage.getItem(key)
          } catch (error) {
            console.error('Error accessing localStorage:', error)
            return null
          }
        },
        setItem: (key: string, value: string) => {
          try {
            localStorage.setItem(key, value)
          } catch (error) {
            console.error('Error setting localStorage:', error)
          }
        },
        removeItem: (key: string) => {
          try {
            localStorage.removeItem(key)
          } catch (error) {
            console.error('Error removing from localStorage:', error)
          }
        }
      }
    },
    cookies: {
      name: 'sb-auth-token',
      lifetime: 60 * 60 * 24 * 7, // 1 week
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production'
    }
  }
);

export const supabase = supabaseClient;

export function createClient() {
  return supabaseClient;
}

export async function getAuthenticatedUser() {
  const supabase = createClient()

  try {
    // Get both user and session
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (userError || sessionError) {
      throw userError || sessionError
    }

    // Only return user if we have both user and valid session
    if (user && session) {
      return user
    }

    return null
  } catch (error) {
    console.error('Error getting authenticated user:', error)
    return null
  }
}

export async function getSession() {
  const supabase = createClient()

  try {
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error) {
      throw error
    }

    // Also check if session is actually valid
    if (session?.expires_at) {
      const expiresAt = new Date(session.expires_at * 1000)
      if (expiresAt < new Date()) {
        return null
      }
    }

    return session
  } catch (error) {
    console.error('Error getting session:', error)
    return null
  }
}
