'use server';

import { Product } from '@/lib/supabase/db.types';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

export async function getProducts(): Promise<Product[]> {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('Missing Supabase environment variables');
      return [];
    }

    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('createdat', { ascending: false });

    if (error) {
      console.error('Supabase query error:', error);
      return [];
    }

    if (!data) {
      console.warn('No products found in the database');
      return [];
    }

    return data;
  } catch (error) {
    console.error('Error in getProducts:', error instanceof Error ? error.message : 'Unknown error');
    return [];
  }
}
