'use server';

import { createClient } from '@/lib/supabase/server';
import { v4 as uuidv4 } from 'uuid';

export async function uploadCustomerAvatar(
  formData: FormData,
  customerId?: string,
) {
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
    const filePath = `customers/${customerId || 'temp'}/${fileName}`;

    // Convert File/Blob to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('product-images') // Using the same bucket for consistency
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

    // If we have a customerId, update the customer's image URL in the customers table
    if (customerId) {
      const { error: updateError } = await supabase
        .from('customers')
        .update({ image_url: urlData.publicUrl })
        .eq('id', customerId);

      if (updateError) {
        console.error('Customer update error:', updateError);
        return {
          success: false,
          error: 'Failed to update customer with new avatar',
        };
      }
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
