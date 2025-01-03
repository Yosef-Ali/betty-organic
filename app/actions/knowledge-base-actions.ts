'use server'

import { Database } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

export async function getKnowledgeBaseEntries(limit = 10) {
  const { data, error } = await supabase
    .from('knowledge_base')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching knowledge base entries:', error)
    return []
  }

  return data
}

export async function getKnowledgeBaseEntryById(id: number) {
  const { data, error } = await supabase
    .from('knowledge_base')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching knowledge base entry:', error)
    return null
  }

  return data
}

export async function createKnowledgeBaseEntry(entry: Database['public']['Tables']['knowledge_base']['Insert']) {
  const { data, error } = await supabase
    .from('knowledge_base')
    .insert(entry)
    .select()

  if (error) {
    console.error('Error creating knowledge base entry:', error)
    return null
  }

  return data[0]
}

export async function updateKnowledgeBaseEntry(id: number, entry: Partial<Database['public']['Tables']['knowledge_base']['Update']>) {
  const { data, error } = await supabase
    .from('knowledge_base')
    .update(entry)
    .eq('id', id)
    .select()

  if (error) {
    console.error('Error updating knowledge base entry:', error)
    return null
  }

  return data[0]
}

export async function deleteKnowledgeBaseEntry(id: number) {
  const { error } = await supabase
    .from('knowledge_base')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting knowledge base entry:', error)
    return false
  }

  return true
}

