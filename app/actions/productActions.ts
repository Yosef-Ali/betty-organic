'use server';

import { supabase } from '@/lib/supabase/supabaseClient';
import { revalidatePath } from 'next/cache';
import { v4 as uuidv4 } from 'uuid';

// Add Product type export
export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  imageUrl: string;
  createdAt: Date;
  status: string;  // Added status field
  totalSales?: number;  // Added optional totalSales field
  // Add other properties as needed
}

export const createProduct = async (formData: FormData) => {
  try {
    // Input validation
    const name = formData.get('name');
    const description = formData.get('description');
    const priceStr = formData.get('price');
    const stockStr = formData.get('stock');

    if (!name || typeof name !== 'string') {
      throw new Error('Name is required');
    }

    const price = priceStr ? parseFloat(priceStr.toString()) : 0;
    const stock = stockStr ? parseInt(stockStr.toString(), 10) : 0;

    if (isNaN(price) || isNaN(stock)) {
      throw new Error('Invalid price or stock value');
    }

    const productId = uuidv4(); // Generate UUID here

    const now = new Date().toISOString();
    const { data: product, error } = await supabase
      .from('products')
      .insert({
        id: productId, // Include the generated UUID
        name,
        description: description || '',
        price,
        stock,
        imageUrl: '/placeholder.svg',
        createdAt: now,
        updatedAt: now
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    if (!product) {
      throw new Error('No product data returned after creation');
    }

    revalidatePath('/dashboard/products');
    return product;
  } catch (error: any) {
    console.error('Error creating product:', error);
    throw new Error('Failed to create product: ' + (error.message || 'Unknown error'));
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

export async function getProducts(): Promise<Product[]> {
  try {
    console.log('Fetching products from Supabase');
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        *,
        order_item(quantity)
      `);

    if (error) {
      console.error('Error fetching products:', error);
      throw new Error('Failed to fetch products');
    }

    const mappedProducts: Product[] = products.map(product => ({
      id: product.id,
      name: product.name,
      price: product.price,
      stock: product.stock,
      imageUrl: product.imageUrl,
      createdAt: new Date(product.createdAt),
      status: product.status || 'active', // Default status
      totalSales: product.order_item?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0
    }));

    console.log('Fetched products:', mappedProducts);
    return mappedProducts;
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
