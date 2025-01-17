"use server";

import { revalidatePath } from "next/cache";
import { createClient } from '@/lib/supabase/server'

export async function uploadProfileImage(formData: FormData) {
  const supabase = await createClient();
  const file = formData.get("file");

  if (!file || !(file instanceof Blob)) {
    console.error("Invalid file:", file);
    return {
      success: false,
      error: "No valid file provided",
      details: { type: 'validation', field: 'file' }
    };
  }

  try {
    const uniqueFileName = `${Date.now()}-${file.name || 'avatar'}`;

    // Convert File/Blob to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    const { data, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(uniqueFileName, buffer, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return {
        success: false,
        error: "Failed to upload to storage",
        details: { type: 'storage', original: uploadError.message }
      };
    }

    console.log('File uploaded:', data?.path);

    // Get public URL
    const { data: publicUrlData } = supabase
      .storage
      .from('avatars')
      .getPublicUrl(data?.path || '');

    if (!publicUrlData?.publicUrl) {
      console.error("Error: No public URL available");
      return {
        success: false,
        error: "Failed to retrieve public URL",
        details: { type: 'url' }
      };
    }

    const fileUrl = publicUrlData.publicUrl;
    console.log('Public URL:', fileUrl);

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error("Error getting user:", userError);
      return {
        success: false,
        error: "Failed to get user information",
        details: { type: 'auth', original: userError?.message }
      };
    }

    // Update user metadata with new avatar URL
    const { error: updateError } = await supabase.auth.updateUser({
      data: { 
        avatar_url: fileUrl,
        full_name: user.user_metadata.full_name // preserve existing metadata
      }
    });

    if (updateError) {
      console.error('Error updating user metadata:', updateError);
      return {
        success: false,
        error: "Failed to update user metadata",
        details: { type: 'metadata', original: updateError.message }
      };
    }

    revalidatePath('/dashboard/profile');
    return {
      success: true,
      imageUrl: fileUrl,
      details: { path: data?.path }
    };
  } catch (error: any) {
    console.error('Unexpected error during upload:', error);
    return {
      success: false,
      error: error.message || "An unexpected error occurred",
      details: { type: 'unexpected' }
    };
  }
}
