'use server';

import { Product } from '@/lib/supabase/db.types';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { cookies } from 'next/headers';

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

export async function createOrder(orderData: {
  items: Array<{
    product_id: string;
    product_name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  shipping_address: {
    name: string;
    street: string;
    city: string;
    state: string;
    zip_code: string;
  };
}) {
  try {
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Get the current user's session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      throw new Error('Authentication required');
    }

    // Get the user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', session.user.id)
      .single();

    if (profileError || !profile) {
      throw new Error('Profile not found');
    }

    // Create the order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        profile_id: profile.id,
        total_amount: orderData.total,
        status: 'pending',
        type: 'retail',
      })
      .select()
      .single();

    if (orderError) {
      console.error('Error creating order:', orderError);
      throw new Error('Failed to create order');
    }

    // Create order items
    const orderItems = orderData.items.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      product_name: item.product_name,
      quantity: item.quantity,
      price: item.price,
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('Error creating order items:', itemsError);
      throw new Error('Failed to create order items');
    }

    return { success: true, order };
  } catch (error) {
    console.error('Error in createOrder:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create order'
    };
  }
}
