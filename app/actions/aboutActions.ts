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

  // Ensure videos array exists (backward compatibility)
  if (data && !data.videos) {
    data.videos = [];
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

    // Check if the about table has a videos column
    const { data: columnInfo, error: columnError } = await supabase
      .from('about')
      .select('videos')
      .limit(1);

    // Prepare content for database
    const contentToSave = {
      id: content.id,
      title: content.title,
      content: content.content,
      images: content.images,
      active: content.active ?? true,
      updated_at: new Date().toISOString(),
    };

    // Only add videos if the column exists
    if (columnInfo && !columnError) {
      // If the column exists in the response data, add videos
      contentToSave['videos'] = content.videos || [];
    } else {
      console.warn('Videos column not found in about table. Videos will not be saved.');
      // We'll continue without the videos field
    }

    const { data, error } = await supabase
      .from('about')
      .upsert(contentToSave)
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
