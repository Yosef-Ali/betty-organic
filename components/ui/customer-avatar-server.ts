'use server';

import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

interface UploadResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

// Directly create Supabase client using @supabase/supabase-js
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function handleCustomerAvatarUpload(
  formData: FormData,
  customerId?: string,
): Promise<UploadResult> {
  try {
    // Get file from FormData
    const fileData = formData.get('file');
    if (!(fileData instanceof File)) {
      throw new Error('Invalid file data');
    }

    // Validate file type
    if (!fileData.type.startsWith('image/')) {
      throw new Error('File must be an image');
    }

    // Generate unique filename
    const fileExt = fileData.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = customerId
      ? `customers/${customerId}/${fileName}`
      : `customers/temp/${fileName}`;

    // Convert File to ArrayBuffer
    const arrayBuffer = await fileData.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('profiles')
      .upload(filePath, buffer, {
        cacheControl: '3600',
        upsert: true,
        contentType: fileData.type,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error('Failed to upload image');
    }

    // Get public URL
    const { data: publicUrl } = supabase.storage
      .from('profiles')
      .getPublicUrl(filePath);

    return {
      success: true,
      imageUrl: publicUrl.publicUrl,
    };
  } catch (error) {
    console.error('Error handling customer avatar upload:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload image',
    };
  }
}
