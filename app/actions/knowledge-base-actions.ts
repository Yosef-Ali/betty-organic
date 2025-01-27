'use server';

import { Database } from '@/types/supabase';
import { createClient } from '@/lib/supabase/server';

export async function getKnowledgeBaseEntries(limit = 10) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('knowledge_base')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching knowledge base entries:', error);
    return [];
  }

  return data;
}

export async function getKnowledgeBaseEntryById(id: number) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('knowledge_base')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching knowledge base entry:', error);
    return null;
  }

  return data;
}

export async function createKnowledgeBaseEntry(
  entry: Omit<
    Database['public']['Tables']['knowledge_base']['Insert'],
    'user_id'
  >,
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('knowledge_base')
    .insert(entry)
    .select();

  if (error) {
    console.error('Error creating knowledge base entry:', error);
    throw error;
  }

  return data[0];
}

export async function updateKnowledgeBaseEntry(
  id: number,
  entry: Partial<Database['public']['Tables']['knowledge_base']['Update']>,
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('knowledge_base')
    .update(entry)
    .eq('id', id)
    .select();

  if (error) {
    console.error('Error updating knowledge base entry:', error);
    throw error;
  }

  return data[0];
}

export async function deleteKnowledgeBaseEntry(id: number) {
  const supabase = await createClient();
  console.log('Server: Attempting to delete entry:', id);

  const { error } = await supabase.from('knowledge_base').delete().eq('id', id);

  if (error) {
    console.error('Server: Error deleting entry:', error);
    throw error;
  }

  console.log('Server: Successfully deleted entry');
  return true;
}
