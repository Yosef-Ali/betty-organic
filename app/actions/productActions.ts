"use server";
import { revalidatePath } from 'next/cache';
import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

export async function uploadImage(formData: FormData, productId: string): Promise<string> {
  try {
    const file = formData.get('file') as File;
    if (!file) {
      throw new Error('No file provided');
    }

    // Ensure the upload directory exists
    await fs.mkdir(UPLOAD_DIR, { recursive: true });

    // Create a unique file name
    const fileName = `${Date.now()}-${file.name}`;
    const filePath = path.join(UPLOAD_DIR, fileName);

    // Read the file data
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // Write the file to the upload directory
    await fs.writeFile(filePath, new Uint8Array(fileBuffer));

    // Save the file URL to your database using Prisma
    const fileUrl = `/uploads/${fileName}`;
    const product = await prisma.product.update({
      where: { id: productId },
      data: { imageUrl: fileUrl },
    });

    return product.imageUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw new Error('Failed to upload image');
  }
}

export async function createProduct(formData: FormData) {
  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const price = parseFloat(formData.get('price') as string);
  const stock = parseInt(formData.get('stock') as string, 10);
  const imageUrl = formData.get('imageUrl') as string;

  try {
    // Provide a default image URL if none is provided
    const finalImageUrl = imageUrl || '/placeholder.svg';

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price,
        stock,
        totalSales: 0,
        imageUrl: finalImageUrl,
      },
    });

    revalidatePath('/dashboard/products');
    return product;
  } catch (error) {
    console.error('Error creating product:', error);
    throw new Error('Failed to create product');
  }
}

export async function updateProduct(id: string, data: FormData) {
  const name = data.get('name') as string;
  const description = data.get('description') as string;
  const price = parseFloat(data.get('price') as string);
  const stock = parseInt(data.get('stock') as string, 10);
  const imageUrl = data.get('imageUrl') as string;

  try {
    // Provide a default image URL if none is provided
    let finalImageUrl = imageUrl;
    if (data.get('file')) {
      finalImageUrl = await uploadImage(data, id);
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        name,
        description,
        price,
        stock,
        imageUrl: finalImageUrl || '/placeholder.svg',
      },
    });

    revalidatePath('/dashboard/products');
    return product;
  } catch (error) {
    console.error('Error updating product:', error);
    throw new Error('Failed to update product');
  }
}

export async function getProductImages(productId: string) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { imageUrl: true }
    });
    return product ? [product.imageUrl] : [];
  } catch (error) {
    console.error('Error fetching product images:', error);
    throw new Error('Failed to fetch product images');
  }
}

export async function getProducts() {
  try {
    return await prisma.product.findMany();
  } catch (error) {
    console.error('Error fetching products:', error);
    throw new Error('Failed to fetch products');
  }
}

export async function getProduct(id: string) {
  try {
    return await prisma.product.findUnique({
      where: { id },
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    throw new Error('Failed to fetch product');
  }
}

export async function deleteProduct(id: string) {
  try {
    await prisma.product.delete({
      where: { id },
    });
    revalidatePath('/dashboard/products');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete product:', error);
    return { success: false, error: 'Failed to delete product' };
  }
}
