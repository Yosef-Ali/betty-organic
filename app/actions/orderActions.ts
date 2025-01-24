'use server';

import { createClient } from '@/lib/supabase/server';
import type { Order } from '@/types/order';
import crypto from 'crypto';

interface OrderItem {
  product_id: string;
  quantity: number;
  price: number;
}

export async function getOrderDetails(orderId: string) {
  const supabase = await createClient();
  try {
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(
        `
        *,
        order_items!order_items_order_id_fkey (
          *,
          product:products!inner (*)
        ),
        profile:profiles!orders_profile_id_fkey (
          id,
          name,
          email,
          role,
          address
        )
      `,
      )
      .eq('id', orderId)
      .single();

    if (orderError) {
      console.error('Error fetching order details:', orderError);
      return { data: null, error: orderError };
    }

    return { data: order, error: null };
  } catch (error) {
    console.error('Error in getOrderDetails:', error);
    return { data: null, error };
  }
}

export async function createOrder(orderData: Order) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('Session validation failed:', authError);
      throw new Error('Session validation failed: Please sign in again');
    }

    if (!orderData?.order_items?.length) {
      throw new Error('Invalid order data: Missing order items');
    }

    const orderToCreate = {
      id: orderData.id,
      profile_id: user.id,
      total_amount: orderData.total_amount,
      status: orderData.status,
      type: orderData.type,
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
        details: orderError.details,
      });
      throw new Error(
        `Database error creating order: ${
          orderError.message || 'Unknown error'
        }`,
      );
    }

    const orderItems = orderData.order_items.map(item => ({
      id: crypto.randomUUID(),
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.price,
      product_name: item.product_name,
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('Database error creating order items:', itemsError);
      throw itemsError;
    }

    return {
      data: { ...order, order_items: orderData.order_items },
      error: null,
    };
  } catch (err) {
    const error = err as Error;
    console.error('Server error creating order:', error);
    return { data: null, error };
  }
}

export async function deleteOrder(orderId: string) {
  const supabase = await createClient();
  try {
    const itemsError = await supabase
      .from('order_items')
      .delete()
      .eq('order_id', orderId);

    if (itemsError.error) {
      console.error('Error deleting order items:', itemsError.error);
      throw itemsError.error;
    }

    const orderError = await supabase.from('orders').delete().eq('id', orderId);

    if (orderError.error) {
      console.error('Error deleting order:', orderError.error);
      throw orderError.error;
    }

    return { success: true };
  } catch (error) {
    console.error('Error in deleteOrder:', error);
    return { success: false, error };
  }
}

export async function getOrders(customerId?: string) {
  const supabase = await createClient();
  try {
    const ordersError = await supabase
      .from('orders')
      .select(
        `
        *,
        order_items!order_items_order_id_fkey (
          *,
          products!inner (*)
        ),
        profile:profiles(id, name, email)
      `,
      )
      .order('created_at', { ascending: false })
      .eq(customerId ? 'profile_id' : '', customerId || '');

    if (ordersError.error) {
      console.error('Supabase error fetching orders:', ordersError.error);
      throw ordersError.error;
    }

    return ordersError.data || [];
  } catch (error) {
    console.error('Error fetching orders:', error);
    return [];
  }
}
