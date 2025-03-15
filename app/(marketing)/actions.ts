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
    console.log('Marketing: Starting order creation with data:',
      JSON.stringify({
        itemCount: orderData.items.length,
        total: orderData.total
      })
    );

    // Check environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('Marketing: Missing Supabase environment variables');
      return {
        success: false,
        error: 'Missing Supabase environment variables'
      };
    }

    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    // Get the current user's session
    console.log('Marketing: Getting user session...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('Marketing: Session error:', sessionError);
      return {
        success: false,
        error: 'Authentication error: ' + sessionError.message
      };
    }

    if (!session) {
      console.error('Marketing: No session found');
      return {
        success: false,
        error: 'Authentication required: No active session'
      };
    }

    console.log('Marketing: Session found for user:', session.user.id);

    // Get the user's profile
    console.log('Marketing: Getting user profile...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', session.user.id)
      .single();

    if (profileError) {
      console.error('Marketing: Profile error:', profileError);
      return {
        success: false,
        error: 'Profile error: ' + profileError.message
      };
    }

    if (!profile) {
      console.error('Marketing: Profile not found for user:', session.user.id);
      return {
        success: false,
        error: 'Profile not found'
      };
    }

    console.log('Marketing: Profile found:', profile);

    // Generate order display ID
    console.log('Marketing: Generating order ID...');
    const display_id = await orderIdService.generateOrderID();
    console.log('Marketing: Generated order ID:', display_id);

    // Create the order
    console.log('Marketing: Creating order in database...');
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        profile_id: profile.id,
        customer_profile_id: profile.id,
        total_amount: orderData.total,
        status: 'confirmed',
        type: 'retail',
        display_id,
      })
      .select()
      .single();

    if (orderError) {
      console.error('Marketing: Order creation error:', orderError);
      return {
        success: false,
        error: 'Order creation failed: ' + orderError.message
      };
    }

    console.log('Marketing: Order created successfully:', order.id);

    // Create order items
    console.log('Marketing: Creating order items...');
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
      console.error('Marketing: Order items creation error:', itemsError);
      // If order items creation fails, delete the order
      console.log('Marketing: Cleaning up failed order...');
      await supabase.from('orders').delete().eq('id', order.id);

      return {
        success: false,
        error: 'Order items creation failed: ' + itemsError.message
      };
    }

    console.log('Marketing: Order items created successfully');

    // Revalidate dashboard paths to refresh the orders data
    console.log('Marketing: Revalidating paths...');
    revalidatePath('/dashboard/orders');
    revalidatePath('/dashboard');

    console.log('Marketing: Order creation completed successfully');
    return { success: true, order };
  } catch (error) {
    console.error('Marketing: Unexpected error in createOrder:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create order'
    };
  }
}
