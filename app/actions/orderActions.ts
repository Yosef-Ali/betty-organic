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
    const authData = await getCurrentUser();

    if (!authData?.user) {
      return {
        data: null,
        error: new Error('Session validation failed: Please sign in again')
      };
    }

    // Verify user role
    if (!['admin', 'sales'].includes(authData.profile?.role)) {
      return {
        data: null,
        error: new Error('Unauthorized: Only admin and sales can create orders')
      };
    }

    // Validate order data
    if (!orderData?.order_items?.length) {
      return {
        data: null,
        error: new Error('Invalid order data: Missing order items')
      };
    }

    // Start a transaction
    const { data, error } = await supabase.rpc('create_order_with_items', {
      order_data: {
        ...orderToCreate,
        profile_id: user.id,
        created_by: user.id,
        status: orderData.status || 'pending',
      },
      order_items: orderData.order_items
    });

    if (error) {
      console.error('Transaction error:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (err) {
    console.error('Server error creating order:', err);
    return {
      data: null,
      error: new Error('Failed to create order. Please try again.')
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
        profile:profiles(id, name, email, role)
      `,
      )
      .order('created_at', { ascending: false });

    // Custom filtering based on user role
    const userRole = authData.profile.role;

    if (userRole === 'sales') {
      // Sales users can only see orders they created
      query = query.eq('profile_id', authData.user.id);
    } else if (userRole === 'customer') {
      // Customers can only see their own orders
      query = query.eq('profile_id', authData.user.id);
    }
    // Admins can see all orders (no additional filtering needed)

    // If customerId is provided, further filter by it
    if (customerId) {
      query = query.eq('profile_id', customerId);
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
