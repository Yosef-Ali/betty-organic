'use server';

import { Product, DbProductInsert, DbProductUpdate } from '@/lib/supabase/db.types';
import { createClient } from '@/lib/supabase/server';

import { revalidatePath } from 'next/cache';
import { v4 as uuidv4 } from 'uuid';

export const createProduct = async (formData: FormData): Promise<Product> => {
  const supabase = await createClient();
  try {
    // Input validation
    const name = formData.get('name') as string;
    const description = formData.get('description') as string | null;
    const priceStr = formData.get('price') as string;
    const stockStr = formData.get('stock') as string;

    if (!name || typeof name !== 'string') {
      throw new Error('Name is required');
    }

    const price = priceStr ? parseFloat(priceStr.toString()) : 0;
    const stock = stockStr ? parseInt(stockStr.toString(), 10) : 0;

    if (isNaN(price) || isNaN(stock)) {
      throw new Error('Invalid price or stock value');
    }

    const productId = uuidv4();
    const now = new Date().toISOString();
    const productData: DbProductInsert = {
      id: productId,
      name,
      description: description || '',
      price,
      stock,
      imageUrl: '/placeholder.svg',
      createdAt: now,
      updatedAt: now,
      active: true,
      totalSales: 0
    };

    const { data: product, error } = await supabase
      .from('products')
      .insert(productData)
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
  const supabase = await createClient();
  try {
    const updates: DbProductUpdate = {
      updatedAt: new Date().toISOString()
    };

    for (const [key, value] of Array.from(data.entries())) {
      if (value instanceof File) continue;
      if (key === 'price') {
        updates.price = parseFloat(value.toString());
      } else if (key === 'stock') {
        updates.stock = parseInt(value.toString(), 10);
      } else if (key in updates) {
        (updates as any)[key] = value.toString();
      }
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
  const supabase = await createClient();
  try {
    const { data: product, error } = await supabase
      .from('products')
      .select('imageUrl')
      .eq('id', productId)
      .single();

    if (error) {
      console.error('Error fetching product images:', error);
      throw new Error('Failed to fetch product images');
    }

    if (!product) {
      return [];
    }

    return product?.imageUrl ? [product.imageUrl] : [];
  } catch (error) {
    console.error('Error fetching product images:', error);
    throw new Error('Failed to fetch product images');
  }
}

export async function getProducts(): Promise<Product[]> {
  const supabase = await createClient();
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('createdat', { ascending: false });

    if (error) throw error;
    return (data || []).map(product => ({
      ...product,
      totalSales: product.totalSales || 0
    }));
  } catch (error) {
    console.error('Error in getProducts:', error);
    throw new Error('Failed to fetch products');
  }
}

export async function getProduct(id: string) {
  const supabase = await createClient();
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
  const supabase = await createClient();
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
