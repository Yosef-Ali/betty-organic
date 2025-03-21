'use server';

import { createClient } from '@/lib/supabase/server';
import { v4 as uuidv4 } from 'uuid';

interface UploadResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

export async function uploadCustomerAvatar(
  formData: FormData,
  customerId?: string,
): Promise<UploadResult> {
  try {
    const supabase = await createClient();

    // Get the file from formData
    const file = formData.get('file');
    if (!file || !(file instanceof Blob)) {
      throw new Error('No file provided');
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new Error('File must be an image');
    }

    // Generate unique filename
    const fileExt = file.type.split('/')[1] || 'jpg';
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = customerId
      ? `customers/${customerId}/${fileName}`
      : `customers/temp/${fileName}`;

    // Convert File/Blob to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('product-images')
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

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);

    if (!urlData) {
      return {
        success: false,
        error: 'Failed to get public URL',
      };
    }

    return {
      success: true,
      imageUrl: urlData.publicUrl,
    };
  } catch (error) {
    console.error('Error handling customer avatar upload:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload image',
    };
  }
}
