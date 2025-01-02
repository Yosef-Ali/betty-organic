import { createClient } from '@/lib/supabase/server';
import { Database } from '@/lib/supabase/database.types';

export type KnowledgeBaseEntry = Database['public']['Tables']['knowledge_base']['Row'];
export type NewKnowledgeBaseEntry = Omit<KnowledgeBaseEntry, 'id' | 'created_at' | 'updated_at'>;

export async function fetchKnowledgeBaseEntries() {
  console.log('Starting to fetch knowledge base entries');
  const supabase = createClient();

  try {
    console.log('Making Supabase query...');
    const { data, error, status } = await supabase
      .from('knowledge_base')
      .select('*')
      .order('created_at', { ascending: false });

    console.log('Supabase response:', { data, error, status });

    if (error) {
      console.error('Supabase error:', error);
      return [];
    }

    console.log('Successfully fetched entries:', data);
    return data || [];
  } catch (error) {
    console.error('Unexpected error in fetchKnowledgeBaseEntries:', error);
    return [];
  }
}

export async function addKnowledgeBaseEntry(entry: NewKnowledgeBaseEntry) {
  try {
    const supabase = createClient();
    const { error } = await supabase
      .from('knowledge_base')
      .insert([entry]);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error adding entry:', error);
    throw new Error('Failed to add entry');
  }
}

export async function deleteKnowledgeBaseEntry(id: number) {
  const supabase = createClient();
  const { error } = await supabase
    .from('knowledge_base')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return { success: true };
}
