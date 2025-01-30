'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

export async function handleCustomerAvatarUpload(
  formData: FormData,
  customerId?: string,
) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  try {
    const file = formData.get('file');
    if (!file || !(file instanceof File)) {
      throw new Error('No file provided');
    }

    // Generate unique filename
    const fileName = `${Date.now()}-${file.name}`;
    const filePath = `profiles/${customerId || 'temp'}/${fileName}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('profiles')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      throw uploadError;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('profiles')
      .getPublicUrl(filePath);

    if (!urlData) {
      throw new Error('Failed to get public URL');
    }

    // If customerId provided, update profile record
    if (customerId) {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ image_url: urlData.publicUrl })
        .eq('id', customerId)
        .eq('role', 'customer');

      if (updateError) {
        throw updateError;
      }
    }

    revalidatePath('/dashboard/customers');
    return { success: true, imageUrl: urlData.publicUrl };
  } catch (error) {
    console.error('Error uploading avatar:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload image',
    };
  }
}
