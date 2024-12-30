"use server";

import { UTApi } from "uploadthing/server";
import { revalidatePath } from "next/cache";
import { supabase } from '@/lib/supabase'; // Adjust this import based on your Supabase client location

const utapi = new UTApi();

export async function uploadImage(formData: FormData) {
  const file = formData.get("file") as File;
  if (!file) {
    throw new Error("No file provided");
  }

  try {
    const { data, error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(file.name, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error("Supabase upload error:", uploadError);
      throw new Error("Failed to upload image to Supabase storage");
    }

    const fileUrl = `https://planiwegceqjbjwibvyfd.supabase.co/storage/v1/object/public/product-images/${data?.path}`;
    const productId = formData.get("productId") as string;

    // Update the existing product with the new image URL
    const { data: product, error } = await supabase
      .from('products')
      .update({ image_url: fileUrl })
      .eq('id', productId)
      .select()
      .single();

    if (error) {
      console.error("Supabase update error:", error);
      throw new Error("Failed to update product image");
    }

    revalidatePath(`/dashboard/products/${productId}/edit`);
    return { success: true, productId: product.id, imageUrl: fileUrl };
  } catch (error) {
    console.error("Error uploading image:", error);
    return { success: false, error: "Failed to upload image" };
  }
}
