'use server';

import { supabase } from "@/lib/supabase"; // Corrected import path

export async function getRecentSales() {
  try {
    const { data: recentSales, error } = await supabase
      .from('orders')
      .select('*, customer:full_name')
      .eq('status', 'paid')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      throw new Error('Failed to fetch recent sales');
    }

    return recentSales;
  } catch (error) {
    console.error('Failed to fetch recent sales:', error);
    throw error;
  }
}
