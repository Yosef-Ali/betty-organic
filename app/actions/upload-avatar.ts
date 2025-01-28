'use server';

import { createClient } from '@/lib/supabase/server';
import { User } from '@supabase/supabase-js';
import { getCurrentUser } from './auth';

export async function uploadAvatar(formData: FormData) {
  try {
    const authData = await getCurrentUser();
    if (!authData?.user) {
      throw new Error('Not authenticated');
    }

    const supabase = createClient();

    // Get the file from formData
    const file = formData.get('file') as File;
    if (!file) {
      throw new Error('No file provided');
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new Error('File must be an image');
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${authData.user.id}-${Date.now()}.${fileExt}`;
    const filePath = `profiles/${fileName}`;

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Delete old avatar if exists
    const { data: profile } = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('id', authData.user.id)
      .single();

    if (profile?.avatar_url) {
      const oldPath = profile.avatar_url.split('/').pop()?.split('?')[0];
      if (oldPath) {
        await supabase.storage
          .from('public')
          .remove([`profiles/${oldPath}`]);
      }
    }

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('public')
      .upload(filePath, buffer, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error('Failed to upload image');
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('public')
      .getPublicUrl(filePath);

    if (!urlData) {
      throw new Error('Failed to get public URL');
    }

    // Update profile with new avatar URL
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        avatar_url: urlData.publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', authData.user.id);

    if (updateError) {
      throw updateError;
    }

    return {
      success: true,
      imageUrl: urlData.publicUrl,
    };
  } catch (error) {
    console.error('Error handling avatar upload:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload avatar',
    };
  }
}
