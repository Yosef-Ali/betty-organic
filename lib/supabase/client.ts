import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/lib/supabase/database.types'

export const createClient = () => {
  return createClientComponentClient<Database>({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  })
}

export async function getAuthenticatedClient() {
  const supabase = createClient()
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
