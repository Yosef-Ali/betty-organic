'use server';

import supabase from '@/lib/supabase/client';
import { Order } from '@/types';
import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { v4 as uuidv4 } from 'uuid';




// Utility functions for key transformation
function transformKeys<T extends object>(
  obj: T,
  transform: (key: string) => string
): any {
  if (!obj) return null;

  if (Array.isArray(obj)) {
    return obj.map(item => transformKeys(item, transform));
  }

  return Object.entries(obj).reduce((acc, [key, value]) => {
    const newKey = transform(key);
    const newValue = value && typeof value === 'object'
      ? transformKeys(value, transform)
      : value;
    return { ...acc, [newKey]: newValue };
  }, {});
}

function toCamelCase(str: string): string {
  return str.replace(/([-_][a-z])/g, group =>
    group.toUpperCase().replace('-', '').replace('_', '')
  );
}

function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

// Transform functions
function transformDatabaseOrder(dbOrder: any): Order {
  return transformKeys(dbOrder, toCamelCase);
}

function transformToDatabase(data: any): any {
  return transformKeys(data, toSnakeCase);
}

// Server Actions
export async function getOrders(): Promise<Order[]> {
  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        *,
        customer:customers!orders_customer_id_fkey(*),
        items:order_item!order_item_order_id_fkey(
          *,
          product:products!order_item_product_id_fkey(*)
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (orders || []).map(transformDatabaseOrder);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return [];
  }
}

export async function getOrderDetails(orderId: string): Promise<Order> {
  try {
    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        *,
        customer:customers!orders_customer_id_fkey(*),
        items:order_item!order_item_order_id_fkey(
          *,
          product:products!order_item_product_id_fkey(*)
        )
      `)
      .eq('id', orderId)
      .single();

    if (error) throw error;
    return transformDatabaseOrder(order);
  } catch (error) {
    console.error('Error fetching order details:', error);
    throw new Error('Failed to fetch order details');
  }
}

export async function createOrder(formData: FormData): Promise<Order> {
  try {
    const orderData = {
      id: uuidv4(),
      customerId: formData.get('customerId'),
      status: formData.get('status'),
      type: formData.get('type'),
      totalAmount: parseFloat(formData.get('totalAmount') as string),
      items: JSON.parse(formData.get('items') as string)
    };

    const dbOrderData = transformToDatabase(orderData);

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert(dbOrderData)
      .select(`
        *,
        customer:customers!orders_customer_id_fkey(*),
        items:order_item!order_item_order_id_fkey(
          *,
          product:products!order_item_product_id_fkey(*)
        )
      `)
      .single();

    if (orderError) throw orderError;

    const orderItems = orderData.items.map((item: any) => ({
      id: uuidv4(),
      orderId: orderData.id,
      ...item
    }));

    const dbOrderItems = transformToDatabase(orderItems);

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(dbOrderItems);

    if (itemsError) throw itemsError;

    revalidatePath('/dashboard/orders');
    return transformDatabaseOrder(order);
  } catch (error) {
    console.error('Error creating order:', error);
    throw new Error('Failed to create order');
  }
}

export async function updateOrder(id: string, formData: FormData): Promise<Order> {
  try {
    const updateData = {
      status: formData.get('status'),
      totalAmount: parseFloat(formData.get('totalAmount') as string),
      items: JSON.parse(formData.get('items') as string)
    };

    const dbUpdateData = transformToDatabase(updateData);

    // Update order items
    await supabase.from('order_items').delete().eq('order_id', id);

    const orderItems = updateData.items.map((item: any) => ({
      id: uuidv4(),
      orderId: id,
      ...item
    }));

    await supabase
      .from('order_items')
      .insert(transformToDatabase(orderItems));

    // Update order
    const { data: order, error } = await supabase
      .from('orders')
      .update(dbUpdateData)
      .eq('id', id)
      .select(`
        *,
        customer:customers!orders_customer_id_fkey(*),
        items:order_item!order_item_order_id_fkey(
          *,
          product:products!order_item_product_id_fkey(*)
        )
      `)
      .single();

    if (error) throw error;

    revalidatePath('/dashboard/orders');
    return transformDatabaseOrder(order);
  } catch (error) {
    console.error('Error updating order:', error);
    throw new Error('Failed to update order');
  }
}

export async function deleteOrder(id: string): Promise<{ success: boolean }> {
  try {
    await supabase.from('order_items').delete().eq('order_id', id);
    await supabase.from('orders').delete().eq('id', id);

    revalidatePath('/dashboard/orders');
    return { success: true };
  } catch (error) {
    console.error('Error deleting order:', error);
    return { success: false };
  }
}
