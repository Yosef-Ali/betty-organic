'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { v4 as uuidv4 } from 'uuid';
import type { Database } from '@/types/supabase';

export interface AboutContent {
  id: string;
  title: string;
  content: string;
  images: string[];
  videos: string[];
  active: boolean;
  created_at: string | null;
  updated_at: string | null;
  created_by: string | null;
}

const DEFAULT_VIDEO = "https://xmumlfgzvrliepxcjqil.supabase.co/storage/v1/object/public/about_images//bettys.mp4";

const DEFAULT_CONTENT: AboutContent = {
  id: uuidv4(),
  title: "About Betty's Organic",
  content: "Welcome to Betty's Organic. Our content is currently being updated.",
  images: [],
  videos: [DEFAULT_VIDEO],
  active: true,
  created_at: null,
  updated_at: null,
  created_by: null
};

export async function getAbout() {
  let retryCount = 0;
  const maxRetries = 3;

  while (retryCount < maxRetries) {
    try {
      console.log(`Attempt ${retryCount + 1} to fetch about content`);
      const supabase = await createClient();

      const { data, error } = await supabase
        .from('about_content')
        .select('*')
        .eq('active', true)
        .maybeSingle();

      if (error) {
        console.error(`Error fetching about content (attempt ${retryCount + 1}):`, error);
        throw error;
      }

      // If no data found, return default content
      if (!data) {
        console.log('No about content found, returning default content');
        return DEFAULT_CONTENT;
      }

      // Create a properly typed object with all required fields
      const rawData = data as unknown as { videos?: string[] } & Database['public']['Tables']['about_content']['Row'];
      const aboutData: AboutContent = {
        id: rawData.id,
        title: rawData.title || DEFAULT_CONTENT.title,
        content: rawData.content || DEFAULT_CONTENT.content,
        images: rawData.images || [],
        videos: rawData.videos || [DEFAULT_VIDEO],
        active: rawData.active ?? true,
        created_at: rawData.created_at,
        updated_at: rawData.updated_at,
        created_by: rawData.created_by
      };

      return aboutData;
    } catch (error) {
      console.error(`Error in getAbout (attempt ${retryCount + 1}):`, error);
      retryCount++;

      if (retryCount === maxRetries) {
        console.error('Max retries reached, returning default content');
        return {
          ...DEFAULT_CONTENT,
          content: "We're currently experiencing technical difficulties. Our team is working to resolve this issue. Please check back later."
        };
      }

      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
    }
  }

  return DEFAULT_CONTENT;
}

export async function saveAbout(content: AboutContent) {
  const supabase = await createClient();
  try {
    const newId = content.id || uuidv4();
    // Make a clean copy of the content to avoid potential issues
    const cleanContent: Database['public']['Tables']['about_content']['Insert'] = {
      id: newId,
      title: content.title,
      content: content.content,
      images: content.images || [],
      videos: content.videos || [],
      active: content.active !== undefined ? content.active : true,
    };

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(cleanContent.id as string)) {
      throw new Error('Invalid UUID format');
    }

    // Log the content being sent to debug
    console.log('Saving about content:', JSON.stringify(cleanContent));

    const { data, error } = await supabase
      .from('about_content')
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
