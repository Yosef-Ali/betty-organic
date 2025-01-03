'use server';

import { createClient } from 'lib/supabase/client';
import type { Database } from 'lib/supabase/database.types';

export interface SalesData {
  recentSales: {
    id: string;
    created_at: string | null;
    status: string;
    customer: { full_name: string };
    items: {
      id: string;
      quantity: number;
      price: number;
      product: {
        name: string;
        images: { url: string }[]
      };
    }[];
    totalAmount: number;
  }[];
  totalSales: number;
}

export async function getRecentSales(): Promise<SalesData> {
  const supabase = createClient();

  try {
    console.log('Fetching recent sales...');
    console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);

    const { data: recentSales, error } = await supabase
      .from('orders')
      .select(`
        id,
        created_at,
        status,
        customer:customers(full_name),
        items:order_item(
          id,
          quantity,
          price,
          product:products(
            name,
            imageUrl
          )
        )
      `)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Supabase error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      throw new Error(`Failed to fetch recent sales: ${error.message}`);
    }

    console.log('Raw query results:', recentSales);

    if (!recentSales || recentSales.length === 0) {
      console.warn('No recent sales found');
      return { recentSales: [], totalSales: 0 };
    }

    console.log('Successfully fetched', recentSales.length, 'recent sales');

    const mappedSales = recentSales.map((order: any) => {
      // Handle customer data explicitly
      const customerData = order.customer as { full_name: string } | { full_name: string }[];
      const customerName = Array.isArray(customerData)
        ? customerData[0]?.full_name || ''
        : (customerData as { full_name: string })?.full_name || '';

      return {
        id: String(order.id),
        created_at: order.created_at as string | null,
        status: String(order.status),
        customer: { full_name: String(customerName) },
        items: (order.items || []).map((item: any) => ({
          id: String(item.id),
          quantity: Number(item.quantity),
          price: Number(item.price),
          product: {
            name: String(item.product?.[0]?.name || ''),
            images: [{ url: String(item.product?.[0]?.imageUrl || '') }] // Convert imageUrl to images array
          }
        })),
        totalAmount: 0  // Will be calculated below
      };
    }).map((order: any) => ({
      ...order,
      totalAmount: order.items.reduce((sum: number, item: any) =>
        sum + (item.price * item.quantity), 0
      )
    }));

    const totalSales = mappedSales.reduce((total: number, order: any) => {
      return total + order.totalAmount;
    }, 0);

    return {
      recentSales: mappedSales,
      totalSales
    };
  } catch (error) {
    console.error('Failed to fetch recent sales:', {
      error,
      timestamp: new Date().toISOString(),
      environment: {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        nodeEnv: process.env.NODE_ENV
      }
    });
    throw error;
  }
}
