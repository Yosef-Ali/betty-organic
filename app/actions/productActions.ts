"use server";
import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase';
import { uploadImage } from './upload-image'; // Import uploadImage from upload-image.ts

// Remove the following redundant uploadImage function
/*
export async function uploadImage(formData: FormData, productId: string): Promise<string> {
  try {
    const file = formData.get('file') as File;
    if (!file) {
      throw new Error('No file provided');
    }

    // Remove productId from path
    const uniqueFileName = `${Date.now()}-${file.name}`; // Ensure unique file name

    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(uniqueFileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Error uploading to Supabase storage:', error);
      throw new Error('Failed to upload image to storage');
    }

    const fileUrl = `https://xmumlfgzvrliepxcjqil.supabase.co/storage/v1/object/public/product-images/${data?.path}`;

    // Update the product with the new image URL
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
      throw new Error('Failed to update product with image URL');
    }

    revalidatePath('/dashboard/products');
    return fileUrl;
  } catch (error: any) {
    console.error('Error uploading image:', error);
    throw new Error('Failed to upload image');
  }
}
*/

export const createProduct = async (formData: FormData) => {
  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const price = parseFloat(formData.get('price') as string);
  const stock = parseInt(formData.get('stock') as string, 10);
  const imageUrl = formData.get('imageUrl') as string;

  try {
    // Provide a default image URL if none is provided
    const finalImageUrl = imageUrl || '/placeholder.svg';

    console.log('Inserting product into Supabase...', { name, description, price, stock, imageUrl: finalImageUrl });
    const { data: product, error } = await supabase
      .from('products')
      .insert({
        name,
        description,
        price,
        stock,
        total_sales: 0,
        imageUrl: finalImageUrl,  // Changed from image_url to imageUrl
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      throw new Error('Failed to create product');
    }

    console.log('Product inserted successfully:', product);

    revalidatePath('/dashboard/products');

    // Return a plain object with necessary fields
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      imageUrl: product.imageUrl,
      total_sales: product.total_sales,
    };
  } catch (error) {
    console.error('Error creating product:', error);
    throw new Error('Failed to create product');
  }
};

export async function updateProduct(id: string, data: FormData) {
  try {
    const updates: Record<string, any> = {};

    // Only include fields that are present in the FormData
    for (const [key, value] of data.entries()) {
      updates[key] = value;
    }

    const { data: product, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase update error:', error);
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
    console.log(`Fetching images for product ID: ${productId}`);
    const { data: product, error } = await supabase
      .from('products')
      .select('imageUrl')  // Changed from image_url to imageUrl
      .eq('id', productId)
      .single();

    if (error) {
      console.error('Error fetching product images:', error);
      console.error('Supabase error details:', error.message, error.details);
      throw new Error('Failed to fetch product images');
    }

    if (!product) {
      console.error('No product found for the given ID:', productId);
      return [];
    }

    console.log('Fetched product images:', product);
    return product?.imageUrl ? [product.imageUrl] : [];
  } catch (error) {
    console.error('Error fetching product images:', error);
    throw new Error('Failed to fetch product images');
  }
}

export async function getProducts() {
  try {
    console.log('Fetching products from Supabase');
    const { data: products, error } = await supabase
      .from('products')
      .select();

    if (error) {
      console.error('Error fetching products:', error);
      console.error('Supabase error details:', error.message, error.details);
      throw new Error('Failed to fetch products');
    }

    console.log('Fetched products:', products);
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
