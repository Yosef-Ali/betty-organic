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
      detectSessionInUrl: true
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
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error) {
      throw error
    }

    return user
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

    return session
  } catch (error) {
    console.error('Error getting session:', error)
    return null
  }
}
