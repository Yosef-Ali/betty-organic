'use server';

import { Product } from '@/lib/supabase/db.types';
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
    // Get the image URL from the form data
    const imageUrl = formData.get('imageUrl') as string || '/placeholder-product.png';
    const status = formData.get('status') as string || 'active';

    if (!name || typeof name !== 'string') {
      throw new Error('Name is required');
    }

    let price = 0;
    let stock = 0;

    try {
      price = priceStr ? parseFloat(priceStr) : 0;
      stock = stockStr ? parseInt(stockStr, 10) : 0;
    } catch (e) {
      throw new Error('Invalid price or stock value');
    }

    if (isNaN(price) || isNaN(stock)) {
      throw new Error('Invalid price or stock value');
    }

    const productId = uuidv4();
    const now = new Date().toISOString();

    const { data: newProduct, error: insertError } = await supabase
      .from('products')
      .insert({
        id: productId,
        name,
        description: description || '',
        price,
        stock,
        imageUrl,
        active: status === 'active',
        createdat: now,
        updatedat: now,
        category: null,
        created_by: null,
        unit: null,
        totalSales: 0
      })
      .select()
      .single();

    if (insertError) {
      console.error('Supabase insert error:', insertError);
      throw new Error(`Database error: ${insertError.message}`);
    }

    if (!newProduct) {
      throw new Error('No product data returned after creation');
    }

    revalidatePath('/dashboard/products');
    return newProduct;
  } catch (error: any) {
    console.error('Error creating product:', error);
    throw new Error('Failed to create product: ' + (error.message || 'Unknown error'));
  }
};

export async function updateProduct(id: string, formData: FormData) {
  const supabase = await createClient();
  try {
    const name = formData.get('name') as string;
    const description = formData.get('description') as string | null;
    const priceStr = formData.get('price') as string;
    const stockStr = formData.get('stock') as string;
    const imageUrl = formData.get('imageUrl') as string;
    const status = formData.get('status') as string;

    if (!name) {
      throw new Error('Name is required');
    }

    let price: number;
    let stock: number;

    try {
      price = priceStr ? parseFloat(priceStr) : 0;
      stock = stockStr ? parseInt(stockStr, 10) : 0;
    } catch (e) {
      throw new Error('Invalid price or stock value');
    }

    if (isNaN(price) || isNaN(stock)) {
      throw new Error('Invalid price or stock value');
    }

    const updates = {
      name,
      description: description || '',
      price,
      stock,
      imageUrl: imageUrl || '/placeholder-product.png',
      active: status === 'active',
      updatedat: new Date().toISOString()
    };

    const { data: product, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase update error:', error);
      throw new Error(`Failed to update product: ${error.message}`);
    }

    if (!product) {
      throw new Error('Product not found');
    }

    revalidatePath('/dashboard/products');
    return product;
  } catch (error: any) {
    console.error('Error updating product:', error);
    throw new Error(error.message || 'Failed to update product');
  }
}

export async function getProductImages(productId: string) {
  if (!productId) {
    console.warn('No product ID provided to getProductImages');
    return [];
  }

  const supabase = await createClient();
  if (!supabase) {
    console.error('Failed to initialize Supabase client');
    return [];
  }

  try {
    const { data: product, error } = await supabase
      .from('products')
      .select('imageUrl')
      .eq('id', productId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching product images:', error);
      return [];
    }

    if (!product || !product.imageUrl) {
      return [];
    }

    return [product.imageUrl];
  } catch (error) {
    console.error('Error fetching product images:', error);
    return [];
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
    return (data || []).map(product => {
      const { imageUrl, ...rest } = product;
      return {
        ...rest,
        imageUrl: imageUrl || '/placeholder.svg',
        totalSales: product.totalSales || 0
      };
    });
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
