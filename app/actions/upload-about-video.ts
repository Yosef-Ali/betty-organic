'use server';

import { createClient } from '@/lib/supabase/server';
import { v4 as uuidv4 } from 'uuid';
import { getCurrentUser } from './auth';

// Increased to 25MB, but we'll implement chunked uploads for better handling
const MAX_FILE_SIZE = 25 * 1024 * 1024;

export async function uploadAboutVideo(formData: FormData) {
  try {
    const authData = await getCurrentUser();
    if (!authData?.user || authData.profile?.role !== 'admin') {
      throw new Error('Only admins can upload about videos');
    }

    // Create authenticated admin client
    const supabase = await createClient();

    // Get the video file from formData
    const file = formData.get('video') as File;
    if (!file) {
      throw new Error('No file provided');
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      throw new Error('File size must be less than 25MB');
    }

    // Validate file type
    if (!file.type.startsWith('video/')) {
      throw new Error('File must be a video');
    }

    // Convert to Uint8Array for Supabase upload
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Generate unique filename with timestamp to prevent caching issues
    const timestamp = Date.now();
    const uuid = uuidv4();
    if (!uuid) {
      throw new Error('Failed to generate valid UUID for video');
    }

    // Use proper file extension based on content type
    const fileExt = file.type.split('/')[1] || 'mp4';
    const fileName = `${uuid}-${timestamp}.${fileExt}`;
    const filePath = `about/videos/${fileName}`;

    // Upload with optimized settings for videos
    const { error: uploadError } = await supabase.storage
      .from('about_videos')
      .upload(filePath, uint8Array, {
        contentType: file.type,
        upsert: true,
        cacheControl: '3600',
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // Get the public URL without transformation parameters
    const { data: urlData } = supabase.storage
      .from('about_videos')
      .getPublicUrl(filePath, {
        download: false,
        transform: {
          quality: 'auto',
        }
      });

    if (!urlData?.publicUrl) {
      throw new Error('Failed to generate public URL for uploaded video');
    }

    // Return the public URL
    return {
      success: true,
      videoUrl: urlData.publicUrl,
    };
  } catch (error) {
    console.error('Error uploading video:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload video',
    };
  }
}
