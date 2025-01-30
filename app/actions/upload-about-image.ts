'use server';

import { createClient } from '@/lib/supabase/server';
import { v4 as uuidv4 } from 'uuid';
import { getCurrentUser } from './auth';

const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB

export async function uploadAboutImage(formData: FormData) {
  try {
    const authData = await getCurrentUser();

    if (!authData?.user || authData.profile?.role !== 'admin') {
      throw new Error('Only admins can upload about images');
    }

    // Create authenticated admin client
    const supabase = await createClient();

    // Get the compressed image blob from formData
    const file = formData.get('image') as Blob;
    if (!file) {
      throw new Error('No file provided');
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      throw new Error('File size must be less than 4MB');
    }

    // Convert Blob to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    // Convert to Uint8Array for Supabase upload
    const uint8Array = new Uint8Array(arrayBuffer);

    // Generate unique filename with timestamp to prevent caching issues
    const timestamp = Date.now();
    const uuid = uuidv4(); // Generate UUID first to ensure it's valid
    if (!uuid) {
      throw new Error('Failed to generate valid UUID for image');
    }

    const fileName = `${uuid}-${timestamp}.jpg`;
    const filePath = `about/${fileName}`; // Add a subfolder to better organize images

    // Upload to Supabase Storage with proper cache control
    const { error: uploadError } = await supabase.storage
      .from('about_images')
      .upload(filePath, uint8Array, {
        contentType: 'image/jpeg',
        upsert: true,
        cacheControl: '3600', // 1 hour cache
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // Get the public URL without transformation parameters to avoid 403 errors
    const { data: urlData } = supabase.storage
      .from('about_images')
      .getPublicUrl(filePath);

    if (!urlData?.publicUrl) {
      throw new Error('Failed to generate public URL for uploaded image');
    }

    return {
      success: true,
      imageUrl: urlData.publicUrl,
      uuid: uuid, // Return the UUID for reference in the about content
    };
  } catch (error) {
    console.error('Error in uploadAboutImage:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload image',
    };
  }
}
