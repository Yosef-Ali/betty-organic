// Optimized database queries with proper indexing and caching

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Optimized product queries
export class ProductQueries {
  static async getActiveProducts(limit: number = 50) {
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
        totalSales,
        createdat,
        updatedat
      `)
      .eq('active', true)
      .order('createdat', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  static async getProductById(id: string) {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }
}

// Database health check
export async function checkDatabaseHealth() {
  const start = Date.now();
  
  try {
    const { error } = await supabase
      .from('products')
      .select('id')
      .limit(1);
    
    const latency = Date.now() - start;
    return { healthy: !error, latency, error: error?.message };
  } catch (error) {
    return { 
      healthy: false, 
      latency: Date.now() - start, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
