"use server";

import { createClient } from "@/lib/supabase/server";

export async function debugOrdersData() {
  const supabase = createClient();
  
  try {
    // Get all orders with their details
    const { data: allOrders, error } = await supabase
      .from('orders')
      .select('id, total_amount, status, created_at, display_id')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) {
      console.error('Error fetching orders:', error);
      return { error: error.message };
    }
    
    console.log('Found orders:', allOrders?.length || 0);
    console.log('Sample orders:', allOrders?.slice(0, 3));
    
    return { 
      count: allOrders?.length || 0, 
      orders: allOrders || [],
      statuses: [...new Set(allOrders?.map(o => o.status) || [])]
    };
    
  } catch (err) {
    console.error('Database error:', err);
    return { error: 'Database connection failed' };
  }
}