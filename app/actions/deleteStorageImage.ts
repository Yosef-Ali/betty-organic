'use server';

import { createClient } from '@/lib/supabase/server';

export async function deleteStorageImage(imagePath: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    // Extract filename from the full URL
    const url = new URL(imagePath);
    const pathParts = url.pathname.split('/');
    const fileName = pathParts[pathParts.length - 1];

    // Delete from Supabase storage
    const { error: deleteError } = await supabase.storage
      .from('product-images')
      .remove([fileName]);

    if (deleteError) {
      console.error('Error deleting image:', deleteError);
      return { success: false, error: deleteError.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in deleteStorageImage:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete image'
    };
  }
}
