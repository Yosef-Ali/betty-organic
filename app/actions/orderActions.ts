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

    // Verify user role and permissions
    if (!authData.profile?.role) {
      console.error('No role found in profile:', authData.profile);
      return {
        data: null,
        error: new Error('Unauthorized: User role not found'),
      };
    }

    const role = authData.profile.role;
    const userId = authData.user.id;

    console.log('Creating order with role:', role, 'userId:', userId);

    // Validate order data
    if (!orderData?.order_items?.length) {
      console.error('Missing order items in order data:', orderData);
      return {
        data: null,
        error: new Error('Invalid order data: Missing order items'),
      };
    }

    // Set profile_id and customer_profile_id based on role
    let profile_id: string;
    let customer_profile_id: string;

    if (role === 'customer') {
      // For customer orders, both IDs should be the customer's ID
      profile_id = userId;
      customer_profile_id = userId;
    } else if (['admin', 'sales'].includes(role)) {
      // For admin/sales orders, profile_id is their ID and customer_profile_id is the selected customer
      profile_id = userId;
      customer_profile_id = orderData.customer_profile_id;

      if (!customer_profile_id) {
        console.error('Missing customer_profile_id for admin/sales order');
        return {
          data: null,
          error: new Error('Customer must be selected for admin/sales orders'),
        };
      }
    } else {
      console.error('Invalid role for order creation:', role);
      return {
        data: null,
        error: new Error('Unauthorized: Invalid role for order creation'),
      };
    }
    console.log('Order configuration:', {
      profile_id,
      customer_profile_id,
      role,
      orderItems: orderData.order_items.length,
    });

    // Create the order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        profile_id,
        customer_profile_id,
        total_amount: orderData.total_amount,
        status: orderData.status || 'pending',
        type:
          orderData.type || (role === 'customer' ? 'self_service' : 'store'),
      })
      .select()
      .single();

    if (orderError) {
      console.error('Database error creating order:', {
        error: orderError,
        profile_id,
        customer_profile_id,
        role,
        orderData,
      });
      throw new Error(
        `Database error creating order: ${
          orderError.message || 'Unknown error'
        }`,
      );
    }

    console.log('Order created successfully:', order);

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
      console.error('Error creating order items:', {
        error: itemsError,
        orderId: order.id,
        items: orderItems.length,
      });
      // If order items creation fails, delete the order
      await supabase.from('orders').delete().eq('id', order.id);
      throw new Error(
        `Failed to create order items: ${
          itemsError.message || 'Unknown error'
        }`,
      );
    }

    console.log('Order items created successfully for order:', order.id);

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
