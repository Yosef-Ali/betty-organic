'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from './auth';
import { v4 as uuidv4 } from 'uuid';

export async function uploadAvatar(formData: FormData) {
  try {
    const authData = await getCurrentUser();
    if (!authData?.user) {
      throw new Error('Not authenticated');
    }

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
    const filePath = `avatars/${authData.user.id}/${fileName}`;

    // Convert File/Blob to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage using product-images bucket (since it's working)
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

    // Update user's avatar URL in profiles table
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: urlData.publicUrl })
      .eq('id', authData.user.id);

    if (updateError) {
      console.error('Profile update error:', updateError);
      return {
        success: false,
        error: 'Failed to update profile with new avatar',
      };
    }

    return {
      success: true,
      imageUrl: urlData.publicUrl,
    };
  } catch (error) {
    console.error('Error handling avatar upload:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload image',
    };
  }
}
