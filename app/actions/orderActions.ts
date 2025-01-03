'use server';

import {
  DbOrderInsert,
  DbOrderItemInsert,
  DbCustomerInsert,
  OrderWithRelations,
  OrderType,
  OrderStatus,
  CustomerStatus
} from '@/lib/supabase/db.types';

import { Order, OrderItem } from '@/types/schema';
import { supabase } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { v4 as uuidv4 } from 'uuid';

// Helper functions
const transformDatabaseOrder = (dbOrder: OrderWithRelations): Order => ({
  id: dbOrder.id,
  customerId: dbOrder.customer_id,
  status: dbOrder.status as OrderStatus,
  type: dbOrder.type as OrderType,
  totalAmount: dbOrder.total_amount,
  createdAt: dbOrder.created_at,
  customer: dbOrder.customer ? {
    id: dbOrder.customer.id,
    full_name: dbOrder.customer.full_name,
    email: dbOrder.customer.email,
    phone: dbOrder.customer.phone,
    location: dbOrder.customer.location,
    status: dbOrder.customer.status as CustomerStatus,
    imageUrl: dbOrder.customer.image_url
  } : null,
  items: dbOrder.items?.map(item => ({
    id: item.id,
    orderId: item.order_id,
    productId: item.product_id,
    quantity: item.quantity,
    price: item.price,
    product: item.product ? {
      id: item.product.id,
      name: item.product.name,
      description: item.product.description,
      price: item.product.price,
      imageUrl: item.product.imageUrl,
      stock: item.product.stock,
      createdAt: item.product.createdAt,
      updatedAt: item.product.updatedAt,
      totalSales: item.product.totalSales
    } : null
  }))
});

const createOrderItems = async (items: OrderItem[], orderId: string): Promise<void> => {
  const orderItemsDB: DbOrderItemInsert[] = items.map(item => ({
    id: uuidv4(),
    order_id: orderId,
    product_id: item.productId,
    quantity: item.quantity,
    price: item.price
  }));

  const { error } = await supabase.from('order_item').insert(orderItemsDB);
  if (error) throw new Error(`Failed to create order items: ${error.message}`);
};

const findOrCreateCustomer = async (customerInfo?: string): Promise<string> => {
  if (!customerInfo) return await getDefaultCustomerId();

  const { data: existing } = await supabase
    .from('customers')
    .select('id')
    .eq('full_name', customerInfo)
    .single();

  if (existing) return existing.id;

  const customerId = uuidv4();
  const customerData: DbCustomerInsert = {
    id: customerId,
    full_name: customerInfo,
    email: '',
    phone: '',
    location: '',
    status: 'active',
    image_url: ''
  };

  const { error } = await supabase.from('customers').insert(customerData);
  if (error) throw new Error('Failed to create customer');

  return customerId;
};

const getDefaultCustomerId = async (): Promise<string> => {
  const { data } = await supabase
    .from('customers')
    .select('id')
    .eq('full_name', 'Default Customer')
    .single();

  if (data) return data.id;

  const customerId = uuidv4();
  const { error } = await supabase
    .from('customers')
    .insert({
      id: customerId,
      full_name: 'Default Customer',
      email: '',
      phone: '',
      location: '',
      status: 'active',
      image_url: ''
    });

  if (error) throw new Error('Failed to create default customer');
  return customerId;
};

// Main actions
export async function getOrders(): Promise<Order[]> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        customer:customers!orders_customer_id_fkey(*),
        items:order_item(*, product:products!order_item_product_id_fkey(*))
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(transformDatabaseOrder);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return [];
  }
}

export async function getOrderDetails(orderId: string): Promise<Order> {
  const { data, error } = await supabase
    .from('orders')
    .select<string, OrderWithRelations>(`
      *,
      customer:customers!orders_customer_id_fkey(*),
      items:order_item(*, product:products!order_item_product_id_fkey(*))
    `)
    .eq('id', orderId)
    .single();

  if (error) throw new Error('Failed to fetch order details');
  return transformDatabaseOrder(data);
}

export async function createOrder(formData: FormData): Promise<Order> {
  try {
    const orderId = uuidv4();
    const status = formData.get('status') as OrderStatus;
    const type = formData.get('type') as OrderType;
    const items: OrderItem[] = JSON.parse(formData.get('items') as string);
    const totalAmount = parseFloat(formData.get('totalAmount') as string);
    const customerId = await findOrCreateCustomer(formData.get('customerInfo') as string);

    const orderData: DbOrderInsert = {
      id: orderId,
      customer_id: customerId,
      status,
      type,
      total_amount: totalAmount
    };

    const { data: order, error } = await supabase
      .from('orders')
      .insert(orderData)
      .select(`
        *,
        customer:customers!orders_customer_id_fkey(*),
        items:order_item(*, product:products!order_item_product_id_fkey(*))
      `)
      .single();

    if (error) throw new Error(`Failed to create order: ${error.message}`);

    await createOrderItems(items, orderId);
    revalidatePath('/dashboard/orders');
    return transformDatabaseOrder(order);
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
}

export async function updateOrder(id: string, formData: FormData): Promise<Order> {
  try {
    const status = formData.get('status') as OrderStatus;
    const items: OrderItem[] = JSON.parse(formData.get('items') as string);

    // Delete existing order items
    const { error: deleteError } = await supabase
      .from('order_item') // Use the correct table name
      .delete()
      .eq('order_id', id);

    if (deleteError) throw new Error('Failed to delete existing order items');

    // Reinsert items in snake_case
    const orderItemsDB: OrderItemInsert[] = items.map((item: any) => ({
      id: uuidv4(),
      order_id: id,
      product_id: item.productId,
      quantity: item.quantity,
      price: item.price
    }));

    const { error: itemsError } = await supabase
      .from('order_item')
      .insert(orderItemsDB);

    if (itemsError) throw new Error('Failed to create new order items');

    // Update order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .update({
        status,
        total_amount: items.reduce((total: number, item: any) => total + (item.price * item.quantity), 0) // Changed to snake_case
      })
      .eq('id', id)
      .select(`
        *,
        customer:customers!orders_customer_id_fkey(*),
        items:order_item(
          *,
          product:products!order_item_product_id_fkey(*)
        )
      `)
      .single();

    if (orderError) throw new Error('Failed to update order');

    revalidatePath('/dashboard/orders');
    return transformDatabaseOrder(order);
  } catch (error) {
    console.error('Error updating order:', error);
    throw new Error('Failed to update order');
  }
}

export async function deleteOrder(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Delete order items first
    const { error: itemsError } = await supabase
      .from('order_item')
      .delete()
      .eq('order_id', id);

    if (itemsError) throw new Error('Failed to delete order items');

    // Delete order
    const { error: orderError } = await supabase
      .from('orders')
      .delete()
      .eq('id', id);

    if (orderError) throw new Error('Failed to delete order');

    revalidatePath('/dashboard/orders');
    return { success: true };
  } catch (error) {
    console.error('Error deleting order:', error);
    return { success: false, error: 'Failed to delete order' };
  }
}
