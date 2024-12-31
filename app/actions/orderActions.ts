'use server';

import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { Order, OrderItem, Customer } from '@/types';

// Define database types with snake_case fields
type OrderItemDB = {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
};

// Utility function to transform database response to application type
function transformDatabaseOrder(dbOrder: any): Order {
  return {
    id: dbOrder.id,
    customerId: dbOrder.customer_id,
    status: dbOrder.status,
    type: dbOrder.type,
    totalAmount: dbOrder.total_amount,
    createdAt: dbOrder.created_at,
    customer: dbOrder.customer ? {
      id: dbOrder.customer.id,
      full_name: dbOrder.customer.full_name,
      email: dbOrder.customer.email,
      phone: dbOrder.customer.phone,
      location: dbOrder.customer.location,
      status: dbOrder.customer.status,
      imageUrl: dbOrder.customer.image_url
    } : null,
    items: dbOrder.items?.map((item: any) => ({
      id: item.id,
      orderId: item.order_id,
      productId: item.product_id,
      quantity: item.quantity,
      price: item.price,
      product: item.product ? {
        id: item.product.id,
        name: item.product.name,
        price: item.product.price,
        imageUrl: item.product.image_url
      } : null
    }))
  };
}

export async function getOrders(): Promise<Order[]> {
  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        *,
        customer:customers(*),
        items:order_item(
          *,
          product:products(*)
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
        customer:customers(*),
        items:order_item(
          *,
          product:products(*)
        )
      `)
      .eq('id', orderId)
      .single();

    if (error) {
      throw new Error('Failed to fetch order details');
    }

    return transformDatabaseOrder(order);
  } catch (error) {
    console.error('Error fetching order details:', error);
    throw new Error('Failed to fetch order details');
  }
}

export async function createOrder(formData: FormData): Promise<Order> {
  try {
    const status = formData.get('status') as string;
    const type = formData.get('type') as string;
    const itemsString = formData.get('items') as string;
    console.log('Raw items data:', itemsString);
    const items: OrderItem[] = JSON.parse(itemsString);
    console.log('Parsed items:', items);
    const totalAmount = parseFloat(formData.get('totalAmount') as string);
    const customerInfo = formData.get('customerInfo') as string;
    console.log('Order details:', { status, type, totalAmount, customerInfo });

    let customerId = '';
    if (customerInfo) {
      // Check if customer already exists
      const { data: existingCustomer, error: findError } = await supabase
        .from('customers')
        .select('id')
        .eq('full_name', customerInfo)
        .single();

      if (findError || !existingCustomer) {
        // Create new customer if not found
        customerId = uuidv4();
        const { error: customerError } = await supabase
          .from('customers')
          .insert({
            id: customerId,
            full_name: customerInfo,
            email: '',
            phone: '',
            location: '',
            status: 'active',
            image_url: ''
          });

        if (customerError) {
          console.error('Error creating customer:', customerError);
          throw new Error('Failed to create customer');
        }
      } else {
        customerId = existingCustomer.id;
      }
    } else {
      // Use a default customer if no info provided
      const { data: defaultCustomer, error: findError } = await supabase
        .from('customers')
        .select('id')
        .eq('full_name', 'Default Customer')
        .single();

      if (findError || !defaultCustomer) {
        // Create default customer if not found
        customerId = uuidv4();
        const { data: newCustomer, error: customerError } = await supabase
          .from('customers')
          .insert({
            id: customerId,
            full_name: 'Default Customer',
            email: '',
            phone: '',
            location: '',
            status: 'active',
            image_url: ''
          })
          .select()
          .single();

        if (customerError) {
          console.error('Error creating default customer:', {
            message: customerError.message,
            details: customerError.details,
            hint: customerError.hint,
            code: customerError.code
          });
          throw new Error(`Failed to create default customer: ${customerError.message}`);
        }
        customerId = newCustomer.id;
      } else {
        customerId = defaultCustomer.id;
      }
    }

    const orderId = uuidv4();

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        id: orderId,
        customer_id: customerId,
        status,
        type,
        total_amount: totalAmount
      })
      .select(`
        *,
        customer:customers(*),
        items:order_item(
          *,
          product:products(*)
        )
      `)
      .single();

    if (orderError) {
      console.error('Error creating order:', {
        message: orderError.message,
        details: orderError.details,
        hint: orderError.hint,
        code: orderError.code
      });
      throw new Error(`Failed to create order: ${orderError.message}`);
    }

    // Create order items with snake_case fields
    console.log('Transforming items for database...');
    const orderItemsDB: OrderItemDB[] = items.map((item: any) => {
      const dbItem = {
        id: uuidv4(),
        order_id: orderId,
        product_id: item.productId,
        quantity: item.quantity,
        price: item.price
      };
      console.log('Transformed item:', dbItem);
      return dbItem;
    });

    console.log('Inserting order items into database...');
    const { error: itemsError } = await supabase
      .from('order_item') // Ensure this matches the actual table name
      .insert(orderItemsDB);

    if (itemsError) {
      console.error('Error creating order items:', {
        message: itemsError.message,
        details: itemsError.details,
        hint: itemsError.hint,
        code: itemsError.code
      });
      throw new Error(`Failed to create order items: ${itemsError.message}`);
    }
    console.log('Successfully inserted items:', orderItemsDB);

    revalidatePath('/dashboard/orders');
    return transformDatabaseOrder(order);
  } catch (error) {
    console.error('Error creating order:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    throw new Error(`Failed to create order: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function updateOrder(id: string, formData: FormData): Promise<Order> {
  try {
    const status = formData.get('status') as string;
    const items: OrderItem[] = JSON.parse(formData.get('items') as string);

    // Delete existing order items
    const { error: deleteError } = await supabase
      .from('order_item') // Use the correct table name
      .delete()
      .eq('order_id', id);

    if (deleteError) throw new Error('Failed to delete existing order items');

    // Reinsert items in snake_case
    const orderItemsDB: OrderItemDB[] = items.map((item: any) => ({
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
        customer:customers(*),
        items:order_item(
          *,
          product:products(*)
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
