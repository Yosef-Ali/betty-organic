'use server';

import { createClient } from '@/lib/supabase/server';
import type { Order } from '@/types/order';
import crypto from 'crypto';
import { getCurrentUser } from './auth';
import { orderIdService } from '@/app/services/orderIdService';
import { revalidatePath } from 'next/cache';

interface OrderItem {
  product_id: string;
  quantity: number;
  price: number;
  product_name: string;
}

export async function getOrderDetails(orderId: string) {
  const supabase = await createClient();
  try {
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(
        `
        id,
        display_id,
        created_at,
        updated_at,
        order_items!order_items_order_id_fkey (
          id,
          product:products!inner (
            id,
            name
          ),
          price,
          quantity
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
    if (!items?.length) {
      console.error('Missing order items in order data:', items);
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
      customer_profile_id = customerId;

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

    // Generate new order display ID
    const display_id = await orderIdService.generateOrderID();

    // Create the order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        profile_id,
        customer_profile_id,
        total_amount: totalAmount,
        status: status,
        type: role === 'customer' ? 'self_service' : 'store',
        display_id,
      })
      .select()
      .single();

    if (orderError) {
      console.error('Database error creating order:', {
        error: orderError,
        profile_id,
        customer_profile_id,
        role,
      });
      throw new Error(
        `Database error creating order: ${orderError.message || 'Unknown error'}`,
      );
    }

    // Create order items
    const orderItems = items.map(item => ({
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
      console.error('Error creating order items:', {
        error: itemsError,
        orderId: order.id,
        items: orderItems.length,
      });
      // If order items creation fails, delete the order
      await supabase.from('orders').delete().eq('id', order.id);
      throw new Error(
        `Failed to create order items: ${itemsError.message || 'Unknown error'}`,
      );
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

export async function updateOrderStatus(orderId: string, status: string) {
  const supabase = await createClient();
  try {
    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId)
      .select()
      .single();

    if (error) {
      console.error('Error updating order status:', error);
      return { success: false, error };
    }

    revalidatePath('/dashboard/orders');
    return { success: true, data };
  } catch (error) {
    console.error('Error in updateOrderStatus:', error);
    return { success: false, error };
  }
}
