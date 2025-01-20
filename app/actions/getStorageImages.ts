'use server';

import { createClient } from '@/lib/supabase/server';

export async function getStorageImages() {
  const supabase = await createClient();

  try {
    // List all files in the product-images bucket
    const { data: files, error } = await supabase
      .storage
      .from('product-images')
      .list();

    if (error) {
      console.error('Error listing storage files:', error);
      return [];
    }

    // Get public URLs for all images
    const images = await Promise.all(
      files.map(async (file) => {
        const { data: urlData } = supabase
          .storage
          .from('product-images')
          .getPublicUrl(file.name);

        return {
          name: file.name,
          url: urlData.publicUrl,
          size: file.metadata?.size,
          created: file.created_at,
        };
      })
    );

    return images;
  } catch (error) {
    console.error('Error fetching storage images:', error);
    return [];
  }
}
