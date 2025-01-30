'use server';

import { createClient } from '@/lib/supabase/server';
import { v4 as uuidv4 } from 'uuid';

/**
 * Uploads an image to the "testimonials" bucket and returns its public URL.
 * This does NOT update any user profile info and is intended for testimonial images only.
 *
 * Expects formData with a "file" key containing the Blob/File to upload.
 *
 * Returns: { success: boolean; imageUrl?: string; error?: string }
 */
export async function uploadTestimonialImage(formData: FormData): Promise<{
  success: boolean;
  imageUrl?: string;
  error?: string;
}> {
  try {
    // Create a supabase client with an admin/service role
    const supabase = await createClient();

    // Extract the file
    const file = formData.get('file');
    if (!file || !(file instanceof Blob)) {
      throw new Error('No file provided');
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new Error('File must be an image');
    }

    // Generate a unique filename
    const fileExt = file.type.split('/')[1] || 'jpg';
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `testimonials/${fileName}`;

    // Convert to ArrayBuffer -> Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to "testimonials" bucket
    const { error: uploadError } = await supabase.storage
      .from('testimonials')
      .upload(filePath, buffer, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return {
        success: false,
        error: uploadError.message || 'Failed to upload image',
      };
    }

    // Get the public URL to display
    const { data: urlData } = supabase.storage
      .from('testimonials')
      .getPublicUrl(filePath);

    if (!urlData) {
      return {
        success: false,
        error: 'Failed to get public URL for testimonial image',
      };
    }

    // Return success + the public URL
    return {
      success: true,
      imageUrl: urlData.publicUrl,
    };
  } catch (error) {
    console.error('Error uploading testimonial image:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload image',
    };
  }
}
