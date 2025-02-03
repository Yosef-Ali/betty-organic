'use server';

import { createClient } from '@/lib/supabase/server';
import type { Order } from '@/types/order';
import crypto from 'crypto';
import { getCurrentUser } from './auth';

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
        customer:profiles!orders_customer_profile_id_fkey (
          id,
          name,
          email,
          role,
          address
        ),
        seller:profiles!orders_profile_id_fkey (
          id,
          name,
          email,
          role
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
    const authData = await getCurrentUser();

    if (!authData?.user) {
      return {
        data: null,
        error: new Error('Session validation failed: Please sign in again'),
      };
    }

    // Verify user role
    if (!['admin', 'sales'].includes(authData.profile?.role)) {
      return {
        data: null,
        error: new Error(
          'Unauthorized: Only admin and sales can create orders',
        ),
      };
    }

    // Validate order data
    if (!orderData?.order_items?.length) {
      return {
        data: null,
        error: new Error('Invalid order data: Missing order items'),
      };
    }

    const user = authData.user;

    // Create the order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        profile_id: user.id,
        customer_profile_id: orderData.customer_profile_id,
        total_amount: orderData.total_amount,
        status: orderData.status,
        type: orderData.type,
      })
      .select()
      .single();

    if (orderError) {
      console.error('Database error creating order:', orderError);
      throw new Error(
        `Database error creating order: ${
          orderError.message || 'Unknown error'
        }`,
      );
    }

    // Create order items
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
      // If order items creation fails, delete the order
      await supabase.from('orders').delete().eq('id', order.id);
      throw itemsError;
    }

    return {
      data: { ...order, order_items: orderItems },
      error: null,
    };
  } catch (err) {
    console.error('Server error creating order:', err);
    return {
      data: null,
      error: new Error('Failed to create order. Please try again.'),
    };
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
    const authData = await getCurrentUser();

    if (!authData?.user) {
      throw new Error('Not authenticated');
    }

    let query = supabase
      .from('orders')
      .select(
        `
        *,
        order_items!order_items_order_id_fkey (
          *,
          products!inner (*)
        ),
        customer:profiles!orders_customer_profile_id_fkey (
          id,
          name,
          email,
          role
        ),
        seller:profiles!orders_profile_id_fkey (
          id,
          name,
          email,
          role
        )
      `,
      )
      .order('created_at', { ascending: false });

    // Apply role-based filtering
    if (authData.profile?.role === 'admin') {
      // Admins can see all orders
    } else if (authData.profile?.role === 'sales') {
      // Sales users can only see orders they created
      query = query.eq('profile_id', authData.user.id);
    } else if (authData.profile?.role === 'customer') {
      // Customers can only see their own orders
      query = query.eq('customer_profile_id', authData.user.id);
    } else {
      throw new Error('Unauthorized: Invalid role');
    }

    // If customerId is provided, further filter by customer_profile_id
    if (customerId) {
      query = query.eq('customer_profile_id', customerId);
    }

    const ordersError = await query;

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
