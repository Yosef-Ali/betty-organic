'use server';

import { Database } from '@/types/supabase';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export async function getSupabaseClient() {
  const cookieStore = cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          cookieStore.delete(name);
        },
      },
    },
  );
}

export async function getKnowledgeBaseEntries(limit = 10) {
  const supabase = await getSupabaseClient();
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
  const supabase = await getSupabaseClient();
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
  const supabase = await getSupabaseClient();

  // Get current user's session
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user.id) {
    throw new Error('Not authenticated');
  }

  const { data, error } = await supabase
    .from('knowledge_base')
    .insert({
      ...entry,
      user_id: session.user.id,
    })
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
  const supabase = await getSupabaseClient();
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
  const supabase = await getSupabaseClient();
  console.log('Server: Attempting to delete entry:', id);

  const { error } = await supabase.from('knowledge_base').delete().eq('id', id);

  if (error) {
    console.error('Server: Error deleting entry:', error);
    throw error;
  }

  console.log('Server: Successfully deleted entry');
  return true;
}
