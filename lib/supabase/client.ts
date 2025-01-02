import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseKey)
export const browserClient = supabase

export async function getAuthenticatedClient() {
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error('Not authenticated')
  }

  return supabase
}

export async function fetchKnowledgeBase() {
  const client = await getAuthenticatedClient()

  const { data, error } = await client
    .from('knowledge_base')
    .select('*')
    .order('id', { ascending: true })

  if (error) {
    console.error('Error fetching knowledge base:', error)
    throw error
  }

  return data
}
