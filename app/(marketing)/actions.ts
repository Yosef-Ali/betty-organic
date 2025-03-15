'use server';

import { Product } from '@/lib/supabase/db.types';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { orderIdService } from '@/app/services/orderIdService';

export async function getProducts(): Promise<Product[]> {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      throw new Error('Missing Supabase environment variables');
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
      throw new Error('Failed to fetch products from database');
    }

    if (!data) {
      throw new Error('No products found in the database');
    }

    return data;
  } catch (error) {
    console.error('Error in getProducts:', error instanceof Error ? error.message : 'Unknown error');
    throw error;
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

    // Generate order display ID
    const display_id = await orderIdService.generateOrderID();

    // Create the order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        profile_id: profile.id,
        customer_profile_id: profile.id, // Set customer profile ID properly
        total_amount: orderData.total,
        status: 'confirmed', // Change from 'pending' to 'confirmed'
        type: 'retail',
        display_id, // Add the display ID
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

    // Revalidate dashboard paths to refresh the orders data
    revalidatePath('/dashboard/orders');
    revalidatePath('/dashboard'); // Also revalidate the main dashboard

    return { success: true, order };
  } catch (error) {
    console.error('Error in createOrder:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create order'
    };
  }
}
