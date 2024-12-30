"use server";
import { revalidatePath } from 'next/cache';
import fs from 'fs/promises';
import path from 'path';
import { supabase } from '@/lib/supabase';

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

    // Save the file URL to your database using Supabase
    const fileUrl = `/uploads/${fileName}`;
    const { data: product, error } = await supabase
      .from('products')
      .update({ image_url: fileUrl })
      .eq('id', productId)
      .select()
      .single();

    if (error) {
      throw new Error('Failed to update product');
    }

    return product.image_url;
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

    const { data: product, error } = await supabase
      .from('products')
      .insert({
        name,
        description,
        price,
        stock,
        total_sales: 0,
        image_url: finalImageUrl,
      })
      .select()
      .single();

    if (error) {
      throw new Error('Failed to create product');
    }

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

    const { data: product, error } = await supabase
      .from('products')
      .update({
        name,
        description,
        price,
        stock,
        image_url: finalImageUrl || '/placeholder.svg',
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error('Failed to update product');
    }

    revalidatePath('/dashboard/products');
    return product;
  } catch (error) {
    console.error('Error updating product:', error);
    throw new Error('Failed to update product');
  }
}

export async function getProductImages(productId: string) {
  try {
    const { data: product, error } = await supabase
      .from('products')
      .select('image_url')
      .eq('id', productId)
      .single();

    if (error) {
      throw new Error('Failed to fetch product images');
    }

    return product ? [product.image_url] : [];
  } catch (error) {
    console.error('Error fetching product images:', error);
    throw new Error('Failed to fetch product images');
  }
}

export async function getProducts() {
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select();

    if (error) {
      throw new Error('Failed to fetch products');
    }

    return products;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw new Error('Failed to fetch products');
  }
}

export async function getProduct(id: string) {
  try {
    const { data: product, error } = await supabase
      .from('products')
      .select()
      .eq('id', id)
      .single();

    if (error) {
      throw new Error('Failed to fetch product');
    }

    return product;
  } catch (error) {
    console.error('Error fetching product:', error);
    throw new Error('Failed to fetch product');
  }
}

export async function deleteProduct(id: string) {
  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error('Failed to delete product');
    }

    revalidatePath('/dashboard/products');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete product:', error);
    return { success: false, error: 'Failed to delete product' };
  }
}
