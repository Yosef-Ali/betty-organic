"use server";

import { UTApi } from "uploadthing/server";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma"; // Adjust this import based on your Prisma client location

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

    // Save the file URL to your database using Prisma
    const product = await prisma.product.create({
      data: {
        imageUrl: fileUrl,
        name: "Default Name", // Replace with actual name
        price: 0, // Replace with actual price
        stock: 0, // Replace with actual stock
      },
    });

    revalidatePath("/products"); // Adjust this path as needed
    return { success: true, productId: product.id, imageUrl: fileUrl };
  } catch (error) {
    console.error("Error uploading image:", error);
    return { success: false, error: "Failed to upload image" };
  }
}
