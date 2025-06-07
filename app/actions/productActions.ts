'use server';

import { Product } from '@/lib/supabase/db.types';
import { ProductCategory } from '@/types/supabase';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { v4 as uuidv4 } from 'uuid';

export async function createProduct(formData: FormData): Promise<Product> {
  const supabase = await createClient();

  // Get the current session
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) {
    throw new Error('You must be logged in to create products');
  }

  // Get user profile to check role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (!profile || (profile.role !== 'admin' && profile.role !== 'sales')) {
    throw new Error('Unauthorized: Insufficient permissions');
  }

  try {
    const name = formData.get('name') as string;
    const description = formData.get('description') as string | null;
    const priceStr = formData.get('price') as string;
    const stockStr = formData.get('stock') as string;
    const imageUrl =
      (formData.get('imageUrl') as string) || '/placeholder-product.svg';
    const status = (formData.get('status') as string) || 'active';
    const category = (formData.get('category') as string) || 'All';

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
        category: category as ProductCategory,
        created_by: session.user.id,
        unit: null,
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
    throw new Error(
      'Failed to create product: ' + (error.message || 'Unknown error'),
    );
  }
}

export async function updateProduct(
  id: string,
  formData: FormData,
): Promise<Product> {
  const supabase = await createClient();

  // Get the current session
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) {
    throw new Error('You must be logged in to update products');
  }

  // Get user profile to check role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (!profile || (profile.role !== 'admin' && profile.role !== 'sales')) {
    throw new Error('Unauthorized: Insufficient permissions');
  }

  try {
    const name = formData.get('name') as string;
    const description = formData.get('description') as string | null;
    const priceStr = formData.get('price') as string;
    const stockStr = formData.get('stock') as string;
    const imageUrl = formData.get('imageUrl') as string;
    const status = formData.get('status') as string;
    const category = (formData.get('category') as string) || 'All';

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
      imageUrl: imageUrl || '/placeholder-product.svg',
      active: status === 'active',
      category: category as ProductCategory,
      updatedat: new Date().toISOString(),
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

export async function getProductImages(productId: string): Promise<string[]> {
  if (!productId) {
    console.warn('No product ID provided to getProductImages');
    return [];
  }

  const supabase = await createClient();

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
  try {
    const supabase = await createClient();
    if (!supabase) {
      throw new Error('Failed to initialize Supabase client');
    }

    const { data, error } = await supabase
      .from('products')
      .select(`
        id,
        name,
        description,
        price,
        stock,
        imageUrl,
        category,
        active,
        unit,
        totalsales,
        createdat,
        updatedat,
        created_by
      `)
      .eq('active', true)
      .order('createdat', { ascending: false });

    if (error) {
      console.error('Error fetching products:', error);
      throw error;
    }

    return (data || []).map(product => ({
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      imageUrl: product.imageUrl || '/placeholder-product.svg',
      category: product.category,
      active: product.active,
      unit: product.unit,
      totalSales: product.totalsales || 0,
      createdAt: product.createdat || new Date().toISOString(),
      updatedAt: product.updatedat || new Date().toISOString(),
      created_by: product.created_by
    }));
  } catch (error) {
    console.error('Error in getProducts:', error);
    throw error;
  }
}

export async function getProduct(id: string): Promise<Product | null> {
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

export async function deleteProduct(
  id: string,
): Promise<{ success: boolean; error?: string | undefined }> {
  const supabase = await createClient();

  // Get the current session
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) {
    throw new Error('You must be logged in to delete products');
  }

  // Get user profile to check role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (!profile || (profile.role !== 'admin' && profile.role !== 'sales')) {
    throw new Error('Unauthorized: Insufficient permissions');
  }

  try {
    const { error } = await supabase.from('products').delete().eq('id', id);

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
