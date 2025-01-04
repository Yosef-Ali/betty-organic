import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/lib/supabase/database.types'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true,
      // Remove the cookies property if it exists
    },
    // Other valid options can stay
  }
)

export default supabase

export async function getAuthenticatedClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase URL or Key is missing')
    throw new Error('Supabase URL or Key is missing')
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) {
      console.error('Error getting user:', error)
      throw error
    }
    if (!user) {
      console.error('No user found')
      throw new Error('Not authenticated')
    }
    return supabase
  } catch (err) {
    console.error('Error in getAuthenticatedClient:', err)
    throw err
  }
}
