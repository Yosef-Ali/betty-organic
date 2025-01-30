'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { v4 as uuidv4 } from 'uuid';

export interface AboutContent {
  id: string;
  title: string;
  content: string;
  images: string[];
  active?: boolean;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
}

export async function getAbout() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('about_content')
    .select('*')
    .maybeSingle();

  if (error) {
    console.error('Error fetching about content:', error);
    return null;
  }
  return data;
}

export async function saveAbout(content: AboutContent) {
  const supabase = await createClient();

  try {
    // Ensure we have a valid UUID for new content
    if (!content.id) {
      content.id = uuidv4();
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(content.id)) {
      throw new Error('Invalid UUID format');
    }

    const { data, error } = await supabase
      .from('about_content')
      .upsert({
        ...content,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    revalidatePath('/about');
    revalidatePath('/dashboard/settings');
    return data;
  } catch (error) {
    console.error('Error saving about content:', error);
    throw error; // Let the component handle the error
  }
}
