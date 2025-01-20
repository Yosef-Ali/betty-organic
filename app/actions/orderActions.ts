'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Order } from "@/types/order";
import crypto from 'crypto';

interface OrderItem {
  product_id: string
  quantity: number
  price: number
}

export async function createOrder(orderData: Order) {
  try {
    // Create authenticated Supabase client
    const supabase = await createClient();

    // Get the current user's session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      console.error('Authentication error:', {
        code: sessionError?.code,
        message: sessionError?.message
      });
      throw new Error(`Authentication error: ${sessionError?.message || 'Unknown error'}`);
    }

    // Validate order data
    if (!orderData?.customer_id || !orderData?.order_items?.length) {
      throw new Error('Invalid order data: Missing required fields');
    }

    // Ensure customer_id matches authenticated user
    if (orderData.customer_id !== session.user.id) {
      throw new Error('Unauthorized: Cannot create order for another user');
    }

    // console.log('Creating order with data:', JSON.stringify(orderData, null, 2));

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
      throw new Error(`Database error creating order: ${orderError.message || 'Unknown error'}`);
    }

    // Then create the order items
    const orderItems = orderData.order_items.map(item => ({
      id: crypto.randomUUID(),
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.price,
      product_name: item.product_name
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
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

    return { data: { ...order, order_items: orderData.order_items }, error: null };

  } catch (err) {
    const error = err as Error;
    console.error('Server error creating order:', {
      message: error.message,
      stack: error.stack
    });
    return { data: null, error };
  }
}

export async function deleteOrder(orderId: string) {
  const supabase = await createClient()
  try {
    // First delete the order items
    const { error: itemsError } = await supabase
      .from('order_items')
      .delete()
      .eq('order_id', orderId)

    if (itemsError) {
      console.error('Error deleting order items:', itemsError)
      throw itemsError
    }

    // Then delete the order
    const { error: orderError } = await supabase
      .from('orders')
      .delete()
      .eq('id', orderId)

    if (orderError) {
      console.error('Error deleting order:', orderError)
      throw orderError
    }

    return { success: true }
  } catch (error) {
    console.error('Error in deleteOrder:', error)
    return { success: false, error }
  }
}

export async function getOrders(customerId?: string) {
  const supabase = await createClient()
  try {
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items!order_items_order_id_fkey (
          *,
          products!inner (*)
        )
      `)
      .order('created_at', { ascending: false })
      .eq(customerId ? 'customer_id' : '', customerId || '')

    if (ordersError) {
      console.error('Supabase error fetching orders:', {
        code: ordersError.code,
        message: ordersError.message,
        details: ordersError.details
      });
      throw ordersError;
    }

    console.log('Orders fetched successfully:', orders);
    return orders
  } catch (error) {
    console.error('Error fetching orders:', error)
    throw error
  }
}
