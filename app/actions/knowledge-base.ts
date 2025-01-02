import { createClient } from '@/lib/supabase/server';
import { Database } from '@/lib/supabase/database.types';

export type KnowledgeBaseEntry = Database['public']['Tables']['knowledge_base']['Row'];
export type NewKnowledgeBaseEntry = Omit<KnowledgeBaseEntry, 'id' | 'created_at' | 'updated_at'>;

export async function fetchKnowledgeBaseEntries() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('knowledge_base')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function addKnowledgeBaseEntry(entry: NewKnowledgeBaseEntry) {
  const supabase = createClient();
  const { error } = await supabase
    .from('knowledge_base')
    .insert([entry]);

  if (error) throw error;
  return { success: true };
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
