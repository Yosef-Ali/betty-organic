"use server";

import { UTApi } from "uploadthing/server";
import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/supabase"; // Adjust this import based on your Supabase client location

const utapi = new UTApi();

export async function uploadImage(formData: FormData) {
  const file = formData.get("file") as File;
  if (!file) {
    throw new Error("No file provided");
  }

  try {
    const response = await utapi.uploadFiles(file);
    if (!response.data?.url) {
      throw new Error("Failed to upload image");
    }

    const fileUrl = response.data.url;

    // Save the file URL to your database using Supabase
    const { data: product, error } = await supabase
      .from('products')
      .insert({
        image_url: fileUrl,
        name: "Default Name", // Replace with actual name
        price: 0, // Replace with actual price
        stock: 0, // Replace with actual stock
      })
      .select()
      .single();

    if (error) {
      throw new Error("Failed to save product");
    }

    revalidatePath("/products"); // Adjust this path as needed
    return { success: true, productId: product.id, imageUrl: fileUrl };
  } catch (error) {
    console.error("Error uploading image:", error);
    return { success: false, error: "Failed to upload image" };
  }
}
