'use server';

import { createClient } from '@/lib/supabase/server';
import { Database } from '@/types/supabase';

export async function getSupabaseClient() {
  return await createClient();
}

export async function getRecentOrders(limit = 5) {
  const supabase = await getSupabaseClient();
  try {
    // Fetch orders with both profile and guest information
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        is_guest_order,
        guest_name,
        guest_email,
        guest_phone,
        profiles:profile_id(name)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.warn('Error fetching recent orders with guest info:', error);
      
      // Fallback: try without guest columns (for older schema)
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('orders')
        .select(`
          *,
          profiles:profile_id(name)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (fallbackError) {
        console.error('Error fetching recent orders fallback:', fallbackError);
        return [];
      }
      
      return fallbackData || [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching recent orders:', error);
    return [];
  }
}

export async function getRecentSales(limit = 5) {
  const supabase = await getSupabaseClient();
  try {
    // Fetch orders with both profile and guest information
    const { data, error } = await supabase
      .from('orders')
      .select(`
        id,
        total_amount,
        created_at,
        is_guest_order,
        guest_name,
        guest_email,
        guest_phone,
        profiles:profile_id(name, email)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.warn('Error fetching recent sales with guest info:', error);
      
      // Fallback: try without guest columns (for older orders)
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('orders')
        .select(`
          id,
          total_amount,
          created_at,
          profiles:profile_id(name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (fallbackError) {
        console.error('Error fetching recent sales fallback:', fallbackError);
        return [];
      }
      
      return fallbackData || [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching recent sales:', error);
    return [];
  }
}

export async function getTotalRevenue() {
  const supabase = await getSupabaseClient();
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('total_amount');

    if (error) throw error;
    return data.reduce((sum, order) => sum + order.total_amount, 0);
  } catch (error) {
    console.error('Error fetching total revenue:', error);
    return 0;
  }
}

export async function getTotalCustomers() {
  const supabase = await getSupabaseClient();
  try {
    const { count, error } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;
    return count ?? 0;
  } catch (error) {
    console.error('Error fetching total customers:', error);
    return 0;
  }
}

export async function getTotalProducts() {
  const supabase = await getSupabaseClient();
  try {
    const { count, error } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;
    return count ?? 0;
  } catch (error) {
    console.error('Error fetching total products:', error);
    return 0;
  }
}

export async function getTotalOrders() {
  const supabase = await getSupabaseClient();
  try {
    const { count, error } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;
    return count ?? 0;
  } catch (error) {
    console.error('Error fetching total orders:', error);
    return 0;
  }
}
