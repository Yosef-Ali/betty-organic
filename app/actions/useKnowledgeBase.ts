'use client';

import { Database } from '@/types/supabase';
import { createClient } from '@/lib/supabase/client';

import { useRouter } from 'next/navigation';

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Link {
  text: string;
  url: string;
}

export interface KnowledgeBaseEntry {
  id: number;
  question: string;
  response: string;
  suggestions: string[];
  links: Link[];
  user_id: string;
  created_at: string | null;
  updated_at?: string | null;
}

export interface NewKnowledgeBaseEntry {
  question: string;
  response: string;
  suggestions: string[];
  links: Link[];
  user_id?: string; // user_id is now optional here
}

export const useKnowledgeBase = () => {
  const supabase = createClient();
  const router = useRouter();

  const parseLinks = (rawLinks: any): Link[] => {
    try {
      if (Array.isArray(rawLinks)) {
        return rawLinks.map(link => ({
          text: String(link.text || ''),
          url: String(link.url || ''),
        }));
      }
      return [];
    } catch (error) {
      console.error('Error parsing links:', error);
      return [];
    }
  };

  const fetchEntries = async () => {
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('Not authenticated');
      }
      return {
        entries: await supabase
          .from('knowledge_base')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .then(({ data }) => {
            return (data || []).map(entry => ({
              id: entry.id,
              question: entry.question,
              response: entry.response,
              suggestions: Array.isArray(entry.suggestions)
                ? entry.suggestions
                : [],
              links: parseLinks(entry.links),
              user_id: entry.user_id || '',
              created_at: entry.created_at,
              updated_at: entry.updated_at,
            })) as KnowledgeBaseEntry[];
          }),
        user,
      };
    } catch (error) {
      console.error('Error in fetchEntries:', error);
      throw error;
    }
  };

  const addEntry = async (entry: NewKnowledgeBaseEntry) => {
    try {
      const { user } = await fetchEntries();

      const jsonEntry = {
        question: entry.question,
        response: entry.response,
        suggestions: entry.suggestions,
        links: entry.links as unknown as Json, // Convert Link[] to Json
        user_id: user?.id, // Include user_id here
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('knowledge_base')
        .insert([jsonEntry]);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error adding entry:', error);
      throw error;
    }
  };

  const deleteEntry = async (id: number) => {
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('Not authenticated');
      }

      const { error } = await supabase
        .from('knowledge_base')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error deleting entry:', error);
      throw error;
    }
  };

  return {
    fetchEntries,
    addEntry,
    deleteEntry,
  };
};
