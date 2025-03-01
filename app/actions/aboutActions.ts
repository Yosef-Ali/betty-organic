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
  try {
    const { data, error } = await supabase
      .from('about_content')
      .select('*')
      .eq('active', true)
      .maybeSingle();

    if (error) {
      console.error('Error fetching about content:', error);
      throw new Error(`Failed to fetch about content: ${error.message}`);
    }

    // Ensure videos array exists even if column doesn't exist in the database yet
    if (data && !data.videos) {
      data.videos = [];

      // Check if we have the specific video URL to include
      const videoUrl = "https://xmumlfgzvrliepxcjqil.supabase.co/storage/v1/object/public/about_images//bettys.mp4";
      data.videos.push(videoUrl);
    }

    return data;
  } catch (error) {
    console.error('Error in getAbout:', error);
    // Return a default structure if there's an error
    return {
      id: uuidv4(),
      title: "About Betty's Organic",
      content: "Welcome to Betty's Organic. Our content is currently being updated.",
      images: [],
      videos: ["https://xmumlfgzvrliepxcjqil.supabase.co/storage/v1/object/public/about_images//bettys.mp4"],
      active: true
    };
  }
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
      // We'll handle videos separately since the column might not exist yet
      active: content.active !== undefined ? content.active : true,
    };

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(cleanContent.id)) {
      throw new Error('Invalid UUID format');
    }

    // Check if videos column exists in the table
    const { error: checkError } = await supabase
      .from('about_content')
      .select('videos')
      .limit(1);

    // If videos column exists, include it in the update
    if (!checkError) {
      cleanContent['videos'] = Array.isArray(content.videos) ? content.videos : [];
    } else {
      console.log('Videos column does not exist yet. Videos will be ignored until migration is applied.');
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
