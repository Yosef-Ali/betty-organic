'use server';

import { supabase } from '@/lib/supabase';

export interface SalesData {
  recentSales: {
    id: string;
    created_at: string;
    status: string; // Keep as string to avoid strict enum typing issues
    customer: { full_name: string };
    items: {
      id: string;
      quantity: number;
      price: number;
      product: { name: string; images: { url: string }[] };
    }[];
    totalAmount: number;
  }[];
  totalSales: number;
}

export async function getRecentSales(): Promise<SalesData> {
  try {
    console.log('Fetching recent sales...');
    const { data: recentSales, error } = await supabase
      .from('orders')
      .select(`
        *,
        customer:customers(full_name),
        items:order_item(
          *,
          product:products(*)
        )
      `)
      // .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(5);

    console.log('Recent sales data:', recentSales);

    if (error) {
      throw new Error('Failed to fetch recent sales');
    }

    // Calculate total sales amount
    console.log('Calculating total sales...');
    const totalSales = recentSales?.reduce((total: number, order: any) => {
      const orderTotal = order.items?.reduce((sum: number, item: any) => {
        console.log('Processing item:', item);
        return sum + (item.price * item.quantity);
      }, 0) || 0;
      console.log('Order total:', orderTotal);
      return total + orderTotal;
    }, 0) || 0;
    console.log('Total sales:', totalSales);

    return {
      recentSales: recentSales?.map(order => ({
        ...order,
        totalAmount: order.items?.reduce((total: number, item: any) => total + (item.price * item.quantity), 0) || 0
      })),
      totalSales
    };
  } catch (error) {
    console.error('Failed to fetch recent sales:', error);
    throw error;
  }
}
