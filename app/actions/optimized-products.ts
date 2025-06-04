'use server';

import { Product } from '@/lib/supabase/db.types';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { cache } from '@/lib/cache';
import { unstable_cache } from 'next/cache';

// Next.js built-in caching for server actions
export const getCachedProducts = unstable_cache(
  async (): Promise<Product[]> => {
    try {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        console.error('Missing Supabase environment variables');
        throw new Error('Missing Supabase environment variables');
      }

      const supabase = createClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      );

      console.log('Fetching products from Supabase (cached)...');
      
      // Optimized query with specific fields and indexing
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
          createdAt:createdat,
          updatedAt:updatedat,
          totalSales,
          created_by
        `)
        .eq('active', true)
        .order('createdat', { ascending: false })
        .limit(50); // Limit to prevent large payloads

      if (error) {
        console.error('Supabase query error:', error);
        throw new Error(`Failed to fetch products: ${error.message}`);
      }

      if (!data) {
        console.warn('No products data returned from Supabase');
        return [];
      }

      // Transform data to match Product interface
      const products: Product[] = data.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        stock: item.stock,
        imageUrl: item.imageUrl || '',
        category: item.category,
        active: item.active,
        unit: item.unit,
        createdAt: item.createdAt || new Date().toISOString(),
        updatedAt: item.updatedAt || new Date().toISOString(),
        totalSales: item.totalSales || 0,
        created_by: item.created_by
      }));

      console.log(`Successfully fetched ${products.length} products (cached)`);
      return products;

    } catch (error) {
      console.error('Error in getCachedProducts:', error);
      throw error;
    }
  },
  ['products-list'],
  {
    revalidate: 300, // Cache for 5 minutes
    tags: ['products']
  }
);

// Memory cache version for client components
export async function getProductsWithMemoryCache(): Promise<Product[]> {
  const cacheKey = 'products-active';
  
  // Try memory cache first
  const cachedProducts = cache.get<Product[]>(cacheKey);
  if (cachedProducts) {
    console.log(`Returning ${cachedProducts.length} products from memory cache`);
    return cachedProducts;
  }

  // Fetch from database
  const products = await getCachedProducts();
  
  // Cache for 5 minutes
  cache.set(cacheKey, products, 5);
  
  return products;
}
