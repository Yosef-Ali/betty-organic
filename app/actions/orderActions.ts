'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import type { Order } from "@/types/order";
import crypto from 'crypto';

interface OrderItem {
  product_id: string
  quantity: number
  price: number
  name: string
}

export async function createOrder(orderData: Order) {
  try {
    // Create authenticated Supabase client
    const supabase = await createClient();

    // Get the current user's session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      throw new Error('Authentication required');
    }

    // Validate order data
    if (!orderData?.customer_id || !orderData?.items?.length) {
      throw new Error('Invalid order data: Missing required fields');
    }

    // Ensure customer_id matches authenticated user
    if (orderData.customer_id !== session.user.id) {
      throw new Error('Unauthorized: Cannot create order for another user');
    }

    console.log('Creating order with data:', JSON.stringify(orderData, null, 2));

    // First create the order without items
    const orderToCreate = {
      id: orderData.id,
      customer_id: session.user.id, // Use the authenticated user's ID
      total_amount: orderData.total_amount,
      status: orderData.status,
      type: orderData.type
    };

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert(orderToCreate)
      .select()
      .single();

    if (orderError) {
      console.error('Database error creating order:', {
        code: orderError.code,
        message: orderError.message,
        details: orderError.details
      });
      throw orderError;
    }

    // Then create the order items
    const orderItems = orderData.items.map(item => ({
      id: crypto.randomUUID(),
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.price
    }));

    const { error: itemsError } = await supabase
      .from('order_item')
      .insert(orderItems);

    if (itemsError) {
      console.error('Database error creating order items:', {
        code: itemsError.code,
        message: itemsError.message,
        details: itemsError.details
      });
      // TODO: Should probably delete the order if items creation fails
      throw itemsError;
    }

    return { data: { ...order, items: orderData.items }, error: null };

  } catch (err) {
    const error = err as Error;
    console.error('Server error creating order:', {
      message: error.message,
      stack: error.stack
    });
    return { data: null, error };
  }
}

export async function getOrders() {
  const supabase = await createClient()
  try {
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          product_id,
          quantity,
          price,
          product_name
        )
      `)
      .order('created_at', { ascending: false })

    if (ordersError) throw ordersError
    return orders
  } catch (error) {
    console.error('Error fetching orders:', error)
    throw error
  }
}
