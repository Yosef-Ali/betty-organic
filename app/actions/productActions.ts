'use server'


import fs from 'fs';
import path from 'path';

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'

export async function uploadImage(data: FormData) {
  const file: File | null = data.get('file') as unknown as File

  if (!file) {
    throw new Error('No file uploaded')
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  // Ensure the upload directory exists
  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const filename = path.join(uploadDir, file.name);
  await fs.promises.writeFile(filename, buffer);
  return `/uploads/${file.name}` // This should be a valid URL
}

export async function createProduct(formData: FormData) {
  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const price = parseFloat(formData.get('price') as string);
  const stock = parseInt(formData.get('stock') as string, 10);
  const imageUrl = formData.get('imageUrl') as string;

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

  return product;
}

export async function updateProduct(id: string, data: FormData) {
  const name = data.get('name') as string;
  const description = data.get('description') as string;
  const price = parseFloat(data.get('price') as string);
  const stock = parseInt(data.get('stock') as string, 10);
  const imageUrl = data.get('imageUrl') as string;

  // Provide a default image URL if none is provided
  let finalImageUrl = imageUrl;
  if (data.get('file')) {
    finalImageUrl = await uploadImage(data);
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
  })

  revalidatePath('/dashboard/products')
  return product
}

export async function getProductImages(productId: string) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { imageUrl: true }
  });
  return product ? [product.imageUrl] : [];
}

export async function getProducts() {
  return await prisma.product.findMany()
}

export async function getProduct(id: string) {
  return await prisma.product.findUnique({
    where: { id },
  })
}


export async function deleteProduct(id: string) {
  try {
    await prisma.product.delete({
      where: { id },
    })
    return { success: true }
  } catch (error) {
    console.error('Failed to delete product:', error)
    return { success: false, error: 'Failed to delete product' }
  }
}


