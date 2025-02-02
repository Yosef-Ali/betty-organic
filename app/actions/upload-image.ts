'use server';

import { createClient } from '@/lib/supabase/server';
import { v4 as uuidv4 } from 'uuid';

export interface ImageUploadResponse {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

export async function uploadImage(
  formData: FormData,
): Promise<ImageUploadResponse> {
  try {
    const file = formData.get('file') as File;
    if (!file) {
      return { success: false, error: 'No file provided' };
    }

    if (!file.type.startsWith('image/')) {
      return { success: false, error: 'File must be an image' };
    }

    const supabase = await createClient();

    // Generate unique file name
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(fileName, file);

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return { success: false, error: uploadError.message };
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from('product-images').getPublicUrl(uploadData.path);

    return {
      success: true,
      imageUrl: publicUrl,
    };
  } catch (error) {
    console.error('Error in uploadImage:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload image',
    };
  }
}
