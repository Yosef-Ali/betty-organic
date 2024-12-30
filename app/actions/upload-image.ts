"use server";

import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/supabase";

export async function uploadImage(formData: FormData) {
  const file = formData.get("file");
  const productId = formData.get("productId") as string;

  if (!productId) {
    console.error("No product ID provided");
    return {
      success: false,
      error: "Product ID is required",
      details: { type: 'validation', field: 'productId' }
    };
  }

  if (!file || !(file instanceof Blob)) {
    console.error("Invalid file:", file);
    return {
      success: false,
      error: "No valid file provided",
      details: { type: 'validation', field: 'file' }
    };
  }

  try {
    console.log('Starting upload for product:', productId);
    const uniqueFileName = `${Date.now()}-${file.name || 'upload'}`;

    // Convert File/Blob to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    const { data, error: uploadError } = await supabase.storage
      .from('product-images')
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

    // Use Supabase's getPublicUrl for reliable URL construction
    const { data: publicUrlData } = supabase
      .storage
      .from('product-images')
      .getPublicUrl(data?.path || '');

    if (!publicUrlData?.publicUrl) {
      console.error("Error: No public URL available");
      return {
        success: false,
        error: "Failed to retrieve public URL",
        details: { type: 'url' }
      };
    }

    const fileUrl = publicUrlData.publicUrl; // Changed from publicURL to publicUrl
    console.log('Public URL:', fileUrl);

    // Update the product with the new image URL
    console.log('Updating product with new image URL...');
    const { data: product, error: dbError } = await supabase
      .from('products')
      .update({
        imageUrl: fileUrl,
      })
      .eq('id', productId)
      .select()
      .single();

    if (dbError) {
      console.error('Error updating product with image URL:', dbError);
      return {
        success: false,
        error: "Failed to update product with image URL",
        details: { type: 'update', original: dbError.message }
      };
    }

    console.log('Product updated with new image URL:', product);

    revalidatePath('/dashboard/products');
    return {
      success: true,
      imageUrl: fileUrl,
      details: { path: data?.path }
    };
  } catch (error: any) {
    console.error("Upload error:", error);
    return {
      success: false,
      error: "Upload failed",
      details: { type: 'unknown', original: error.message }
    };
  }
}
