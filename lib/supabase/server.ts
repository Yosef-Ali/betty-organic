// lib/supabase/server.ts
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from './database.types'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Direct server-side client
export const supabase = createSupabaseClient<Database>(supabaseUrl, supabaseKey)

// For server components and API routes
export const createClient = () =>
  createServerComponentClient<Database>({
    cookies,
  })

// Type helper
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
