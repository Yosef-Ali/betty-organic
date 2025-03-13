'use server';

import { createClient } from '@/lib/supabase/server';
import type { Order } from '@/types/order';
import crypto from 'crypto';
import { getCurrentUser } from './auth';
import { OrderIDService } from '../../src/services/OrderIDService';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

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

export async function createOrder(
  items: OrderItem[],
  customerId: string,
  totalAmount: number,
  status: string = 'pending'
) {
  try {
    const supabase = await createClient();
    const authData = await getCurrentUser();

    if (!authData?.user) {
      throw new Error('User not authenticated');
    }

    // Generate a new order ID using the OrderIDService
    const orderIDService = OrderIDService.getInstance();
    const displayId = orderIDService.generateOrderID();

    // Create the order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([
        {
          customer_id: customerId,
          total_amount: totalAmount,
          status: status,
          created_by: authData.user.id,
          display_id: displayId
        }
      ])
      .select()
      .single();

    if (orderError) {
      throw orderError;
    }

    // Create order items
    const orderItems = items.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.price
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      throw itemsError;
    }

    revalidatePath('/dashboard/orders');
    return { success: true, order };
  } catch (error) {
    console.error('Error creating order:', error);
    return { success: false, error };
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
