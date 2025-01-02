// lib/supabase/server.ts
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { Database } from './database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Direct server-side client
export const supabase = createSupabaseClient<Database>(supabaseUrl, supabaseKey)

// For server-side operations
export const createClient = () => {
  return createSupabaseClient<Database>(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false
    }
  })
}

// Type helper
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
