'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { v4 as uuidv4 } from 'uuid';

export interface AboutContent {
  id: string;
  title: string;
  content: string;
  images: string[];
  videos: string[]; // Added videos array
  active?: boolean;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
}

export async function getAbout() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('about')
    .select('*')
    .maybeSingle();

  if (error) {
    console.error('Error fetching about content:', error);
    throw new Error(`Failed to fetch about content: ${error.message}`);
  }

  // Ensure videos array exists even if it's null in the database
  if (data && !data.videos) {
    data.videos = [];
  }

  return data;
}

export async function saveAbout(content: AboutContent) {
  const supabase = await createClient();
  try {
    // Make a clean copy of the content to avoid potential issues
    const cleanContent = {
      id: content.id || uuidv4(),
      title: content.title,
      content: content.content,
      images: content.images || [],
      videos: Array.isArray(content.videos) ? content.videos : [], // Ensure videos is always an array
      active: content.active !== undefined ? content.active : true,
    };

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(cleanContent.id)) {
      throw new Error('Invalid UUID format');
    }

    // Log the content being sent to debug
    console.log('Saving about content:', JSON.stringify(cleanContent));

    const { data, error } = await supabase
      .from('about')
      .upsert({
        ...cleanContent,
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
