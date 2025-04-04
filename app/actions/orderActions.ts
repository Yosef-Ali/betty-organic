'use server';

import { createClient } from '@/lib/supabase/server';
import type { Order as FrontendOrder, OrderItem as FrontendOrderItem } from '@/types/order'; // Rename imported Order
import { getCurrentUser } from './auth';
import { orderIdService } from '@/app/services/orderIdService';
import { revalidatePath } from 'next/cache';
import { Database } from '@/types/supabase'; // Import Database type

// Define specific DB types based on Database
type OrderRow = Database['public']['Tables']['orders']['Row'];
type OrderInsert = Database['public']['Tables']['orders']['Insert'];
type OrderUpdate = Database['public']['Tables']['orders']['Update'];
type OrderItemRow = Database['public']['Tables']['order_items']['Row'];
type OrderItemInsert = Database['public']['Tables']['order_items']['Insert'];
type ProfileRow = Database['public']['Tables']['profiles']['Row'];

// Input type for items in create/update functions
// Exclude fields that are set server-side (like order_id) or DB-generated (like id)
type InputOrderItem = Omit<OrderItemInsert, 'order_id' | 'id'>;

// Response type using the frontend Order definition
interface OrderResponse {
  success: boolean;
  order?: FrontendOrder;
  error?: string;
}

// Helper to check if an object is a PostgrestError
function isPostgrestError(error: any): error is { message: string; code: string; details: string; hint: string } {
  return error && typeof error.message === 'string';
}

// Type guard for the complex structure returned by getOrderDetails select
// Ensure this accurately reflects the fields selected, including nested structures
type FetchedOrderDetails = OrderRow & {
  order_items: (OrderItemRow & {
    product: Database['public']['Tables']['products']['Row'] | null;
  })[] | null;
  profile: ProfileRow | null;
  customer: ProfileRow | null;
};

function isFetchedOrderDetails(data: any): data is FetchedOrderDetails {
  // Basic check, might need refinement based on actual data structure
  return data && typeof data.id === 'string';
}

// Add type guard for OrderItem
function isOrderItem(item: any): item is OrderItemRow {
  return item &&
    typeof item.product_id === 'string' &&
    typeof item.quantity === 'number' &&
    typeof item.price === 'number';
}

// Add mapping function for OrderItems
function mapToFrontendOrderItem(item: OrderItemInsert): FrontendOrderItem {
  return {
    id: '', // New items don't have IDs yet
    order_id: item.order_id,
    product_id: item.product_id,
    product_name: item.product_name,
    quantity: item.quantity,
    price: item.price,
  };
}

// Add mapping function for Order
function mapToFrontendOrder(orderData: OrderRow, orderItems: OrderItemInsert[]): FrontendOrder {
  return {
    id: orderData.id,
    profile_id: orderData.profile_id,
    customer_profile_id: orderData.customer_profile_id || '',
    total_amount: orderData.total_amount,
    status: orderData.status,
    type: orderData.type,
    display_id: orderData.display_id || undefined,
    created_at: orderData.created_at,
    updated_at: orderData.updated_at,
    order_items: orderItems.map(mapToFrontendOrderItem),
    items: orderItems.map(mapToFrontendOrderItem), // Same mapping for both arrays
  };
}

export async function getOrderDetails(orderId: string): Promise<{ data: FrontendOrder | null; error: string | null }> {
  const supabase = await createClient();
  try {
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select(`
        id, display_id, created_at, updated_at, status, total_amount, type, profile_id, customer_profile_id,
        order_items ( id, order_id, product_id, quantity, price, product_name, product:products (id, name) ),
        profile:profiles!orders_profile_id_fkey ( id, name, email, role, status, created_at, updated_at, avatar_url ),
        customer:profiles!orders_customer_profile_id_fkey ( id, name, email, role, status, created_at, updated_at, avatar_url )
      `)
      .eq('id' as any, orderId)
      .single();

    if (orderError) {
      console.error('[DASHBOARD DEBUG] Error fetching order details:', orderError);
      return { data: null, error: orderError.message };
    }
    if (!orderData || !isFetchedOrderDetails(orderData)) {
      console.warn(`[DASHBOARD DEBUG] No order found or invalid structure for ID: ${orderId}`);
      return { data: null, error: 'Order not found or invalid data structure' };
    }

    // Map DB Row to Frontend Order type safely
    const responseOrder: FrontendOrder = {
      id: orderData.id,
      profile_id: orderData.profile_id,
      customer_profile_id: orderData.customer_profile_id || '',
      total_amount: orderData.total_amount,
      status: orderData.status,
      type: orderData.type,
      display_id: orderData.display_id || undefined,
      created_at: orderData.created_at,
      updated_at: orderData.updated_at,
      // Map order_items safely, ensuring it matches FrontendOrderItem[]
      order_items: orderData.order_items?.map((item): FrontendOrderItem => ({
        id: item.id || '',
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        price: item.price,
        product: item.product ? { name: item.product.name } : undefined,
        order_id: item.order_id,
      })) || [],
      // Map items safely, ensuring it matches FrontendOrderItem[] (or Partial if intended)
      // Correcting the mapping to ensure it produces FrontendOrderItem[]
      items: orderData.order_items?.map((item): FrontendOrderItem => ({
        id: item.id || '',
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        price: item.price,
        order_id: item.order_id, // Include required fields
        // product: item.product ? { name: item.product.name } : undefined, // Include if needed
      })) || [],
      customer: orderData.customer ? {
        id: orderData.customer.id,
        name: orderData.customer.name,
        email: orderData.customer.email,
        phone: orderData.customer.phone,
        role: orderData.customer.role,
      } : undefined,
      customer_id: orderData.customer_profile_id || undefined,
    };

    return { data: responseOrder, error: null };
  } catch (error) {
    console.error('[DASHBOARD DEBUG] Error in getOrderDetails:', error);
    const message = error instanceof Error ? error.message : 'Unknown error fetching order details';
    return { data: null, error: message };
  }
}

export async function createOrder(
  items: InputOrderItem[],
  customerId: string,
  totalAmount: number,
  status: string = 'pending'
): Promise<OrderResponse> {
  try {
    console.log('[DASHBOARD DEBUG] Starting order creation...');
    const supabase = await createClient();
    const authData = await getCurrentUser();
    if (!authData?.user) throw new Error('User not authenticated');
    if (!authData.profile?.role) return { success: false, error: 'Unauthorized: User role not found' };
    const role = authData.profile.role;
    const userId = authData.user.id;
    if (!items?.length) return { success: false, error: 'Invalid order data: Missing order items' };
    let profile_id: string;
    let customer_profile_id: string | null = null;
    if (role === 'customer') {
      profile_id = userId;
      customer_profile_id = userId;
    } else if (['admin', 'sales'].includes(role)) {
      profile_id = userId;
      if (!customerId) return { success: false, error: 'Customer must be selected for admin/sales orders' };
      customer_profile_id = customerId;
    } else {
      return { success: false, error: 'Unauthorized: Invalid role for order creation' };
    }
    const display_id = await orderIdService.generateOrderID();
    console.log('[DASHBOARD DEBUG] Generated order ID:', display_id);

    // Prepare the exact OrderInsert object based on types/supabase.ts
    const orderToInsert: OrderInsert = {
      profile_id,
      customer_profile_id,
      total_amount: totalAmount,
      status: status,
      type: role === 'customer' ? 'self_service' : 'store',
      display_id: display_id || null,
      // id, created_at, updated_at are excluded
    };

    console.log('[DASHBOARD DEBUG] Creating order in database...');
    // Use explicit type for insert data to satisfy overload
    const { data: insertedOrderData, error: orderError } = await supabase
      .from('orders')
      .insert(orderToInsert as OrderInsert) // Cast to exact type
      .select()
      .single();

    if (orderError || !insertedOrderData) {
      console.error('[DASHBOARD DEBUG] Database error creating order:', orderError);
      const message = orderError ? orderError.message : 'Order data unexpectedly null after insert.';
      return { success: false, error: `Database error creating order: ${message}` };
    }
    // Now insertedOrderData is OrderRow
    const orderId = insertedOrderData.id; // Safe access
    console.log('[DASHBOARD DEBUG] Order created successfully:', orderId);

    // Prepare OrderItemInsert objects strictly
    const orderItemsToInsert: OrderItemInsert[] = items.map(item => ({
      order_id: orderId,
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.price,
      product_name: item.product_name,
      // id is excluded
    }));

    console.log('[DASHBOARD DEBUG] Creating order items...');
    // Use explicit type for insert data
    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItemsToInsert as OrderItemInsert[]); // Cast to exact type

    if (itemsError) {
      console.error('[DASHBOARD DEBUG] Error creating order items:', { error: itemsError, orderId, items: orderItemsToInsert.length });
      console.log('[DASHBOARD DEBUG] Cleaning up failed order...');
      await supabase.from('orders').delete().eq('id' as any, orderId); // Use 'as any' workaround
      return { success: false, error: `Failed to create order items: ${itemsError.message || 'Unknown error'}` };
    }

    console.log('[DASHBOARD DEBUG] Order items created successfully');
    revalidatePath('/dashboard/orders');
    console.log('[DASHBOARD DEBUG] Order creation completed successfully');

    // Construct the response object matching the frontend 'Order' type
    const responseOrder: FrontendOrder = {
      id: insertedOrderData.id,
      profile_id: insertedOrderData.profile_id,
      customer_profile_id: insertedOrderData.customer_profile_id || '',
      total_amount: insertedOrderData.total_amount,
      status: insertedOrderData.status,
      type: insertedOrderData.type,
      display_id: insertedOrderData.display_id || undefined,
      created_at: insertedOrderData.created_at,
      updated_at: insertedOrderData.updated_at,
      order_items: orderItemsToInsert.map((insertedItem): FrontendOrderItem => ({
        id: '', // Placeholder ID
        product_id: insertedItem.product_id,
        product_name: insertedItem.product_name,
        quantity: insertedItem.quantity,
        price: insertedItem.price,
        order_id: insertedItem.order_id,
      })),
      // Corrected mapping for 'items' to ensure FrontendOrderItem[]
      items: orderItemsToInsert.map((insertedItem): FrontendOrderItem => ({
        id: '',
        product_id: insertedItem.product_id,
        product_name: insertedItem.product_name,
        quantity: insertedItem.quantity,
        price: insertedItem.price,
        order_id: insertedItem.order_id, // Include required fields
      })),
      // customer: undefined, // Add if needed
    };

    return {
      success: true,
      order: responseOrder,
    };
  } catch (error) {
    console.error('[DASHBOARD DEBUG] Error creating order:', error);
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    return { success: false, error: message };
  }
}

export async function deleteOrder(orderId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  try {
    const { error: itemsError } = await supabase
      .from('order_items')
      .delete()
      .eq('order_id' as any, orderId); // Use 'as any' workaround

    if (itemsError) {
      console.error('[DASHBOARD DEBUG] Error deleting order items:', itemsError);
      throw itemsError;
    }

    const { error: orderError } = await supabase
      .from('orders')
      .delete()
      .eq('id' as any, orderId); // Use 'as any' workaround

    if (orderError) {
      console.error('[DASHBOARD DEBUG] Error deleting order:', orderError);
      throw orderError;
    }

    revalidatePath('/dashboard/orders');
    return { success: true };
  } catch (error) {
    console.error('[DASHBOARD DEBUG] Error in deleteOrder:', error);
    const message = isPostgrestError(error) ? error.message : (error instanceof Error ? error.message : 'Unknown error');
    return { success: false, error: message };
  }
}

// Return type should match OrderRow or null based on Supabase types
export async function getOrderById(orderId: string): Promise<OrderRow | null> {
  const supabase = await createClient();
  try {
    const { data: orderData, error } = await supabase
      .from('orders')
      .select(`
        id, display_id, created_at, updated_at, status, total_amount, type, profile_id, customer_profile_id,
        order_items ( id, order_id, product_id, quantity, price, product_name, product:products (id, name) ),
        profile:profiles!orders_profile_id_fkey ( id, name, email, role ),
        customer:profiles!orders_customer_profile_id_fkey ( id, name, email, role )
      `)
      .eq('id' as any, orderId) // Use 'as any' workaround
      .single();

    if (error) {
      if (error.code !== 'PGRST116') {
        console.error(`[Server Action] Error fetching order by ID ${orderId}:`, error);
      }
      return null;
    }
    // Return the raw data which should conform to OrderRow plus nested relations
    // Cast needed if select returns a more complex type than OrderRow
    return orderData as OrderRow | null;
  } catch (error) {
    console.error(`[Server Action] Unexpected error in getOrderById for ${orderId}:`, error);
    return null;
  }
}

// Create a type to represent the complex joined query result
type OrderWithRelationsResult = OrderRow & {
  order_items: (OrderItemRow & {
    products: Database['public']['Tables']['products']['Row'] | null;
  })[] | null;
  customer: ProfileRow | null;
  seller: ProfileRow | null;
};

// Using a specific type for return value from getOrders
export async function getOrders(customerId?: string): Promise<Array<OrderWithRelationsResult & { customer_id?: string }>> {
  const supabase = await createClient();
  try {
    const authData = await getCurrentUser();
    if (!authData?.user) throw new Error('Not authenticated');

    let query = supabase
      .from('orders')
      .select(`*, order_items!order_items_order_id_fkey (*, products!inner (*)), customer:profiles!orders_customer_profile_id_fkey (id, name, email, role), seller:profiles!orders_profile_id_fkey (id, name, email, role)`)
      .order('created_at', { ascending: false });

    // Apply role-based filtering with type assertions to fix TypeScript errors
    if (authData.profile?.role === 'admin') { /* No filter */ }
    else if (authData.profile?.role === 'sales') {
      query = query.eq('profile_id', authData.user.id) as any; // Type assertion after the method call
    }
    else if (authData.profile?.role === 'customer') {
      query = query.eq('customer_profile_id', authData.user.id) as any; // Type assertion after the method call
    }
    else { throw new Error('Unauthorized: Invalid role'); }

    // Apply customer filter if provided
    if (customerId) {
      query = query.eq('customer_profile_id', customerId) as any; // Type assertion after the method call
    }

    const { data, error } = await query;
    if (error) {
      console.error('[DASHBOARD DEBUG] Supabase error fetching orders:', error);
      throw error;
    }

    // Cast the result to our known type and add customer_id for backwards compatibility
    const orders = (data || []) as OrderWithRelationsResult[];
    return orders.map(order => ({
      ...order,
      customer_id: order.customer_profile_id || undefined, // Convert null to undefined to match the expected type
    }));
  } catch (error) {
    console.error('[DASHBOARD DEBUG] Error fetching orders:', error);
    return [];
  }
}

export async function updateOrderStatus(
  orderId: string,
  status: string
): Promise<{ success: boolean; data?: OrderRow | null; error?: string }> {
  const supabase = await createClient();
  try {
    // Ensure status is a valid value that matches your DB schema
    const validStatuses = ['pending', 'processing', 'completed', 'cancelled', 'error'];
    const validStatus = validStatuses.includes(status) ? status : 'pending';

    // Prepare the update object with proper typing
    const updateData: OrderUpdate = {
      status: validStatus
    };

    // Execute the update with type assertions where needed
    const { data: updatedOrder, error } = await supabase
      .from('orders')
      .update(updateData as any) // Type assertion here
      .eq('id' as any, orderId)  // And here
      .select()
      .single();

    if (error) {
      console.error('[DASHBOARD DEBUG] Error updating order status:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/dashboard/orders');
    return { success: true, data: updatedOrder }; // Data is OrderRow | null
  } catch (error) {
    console.error('[DASHBOARD DEBUG] Error in updateOrderStatus:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: message };
  }
}

export async function updateOrder(orderId: string, formData: FormData): Promise<OrderResponse> {
  const supabase = await createClient();
  try {
    const status = formData.get('status') as string;
    const itemsJson = formData.get('items') as string;
    const items: InputOrderItem[] = JSON.parse(itemsJson);

    const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Prepare the update object matching OrderUpdate type
    const orderUpdateData: OrderUpdate = {
      status,
      total_amount: totalAmount,
      updated_at: new Date().toISOString()
    };

    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .update(orderUpdateData) // Pass correctly typed object
      .eq('id' as any, orderId) // Use 'as any' workaround
      .select()
      .single();

    if (orderError || !orderData) {
      console.error('[DASHBOARD DEBUG] Error updating order:', orderError);
      const message = orderError ? orderError.message : 'Order data unexpectedly null after update.';
      return { success: false, error: message };
    }
    // Now orderData is OrderRow

    // Delete existing items
    const { error: deleteError } = await supabase
      .from('order_items')
      .delete()
      .eq('order_id' as any, orderId); // Use 'as any' workaround

    if (deleteError) {
      console.error('[DASHBOARD DEBUG] Error deleting existing order items:', deleteError);
      return { success: false, error: deleteError.message };
    }

    // Prepare new items for insert matching OrderItemInsert
    const orderItemsToInsert: OrderItemInsert[] = items.map(item => ({
      order_id: orderId,
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.price,
      product_name: item.product_name,
      // id is excluded
    }));

    // Insert new items with proper typing and validation
    const { data: insertedItems, error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItemsToInsert)
      .select<'order_items', OrderItemRow>();

    if (itemsError) {
      console.error('[DASHBOARD DEBUG] Error updating order items:', itemsError);
      // Attempt rollback of order update
      await supabase
        .from('orders')
        .update({ status: 'error', updated_at: new Date().toISOString() } as OrderUpdate)
        .eq('id' as any, orderId);
      return { success: false, error: itemsError.message };
    }

    if (!insertedItems?.length) {
      console.error('[DASHBOARD DEBUG] No items were inserted');
      return { success: false, error: 'Failed to insert order items' };
    }

    revalidatePath('/dashboard/orders');

    return {
      success: true,
      order: mapToFrontendOrder(orderData, insertedItems)
    };
  } catch (error) {
    console.error('[DASHBOARD DEBUG] Error in updateOrder:', error);
    const message = error instanceof Error ? error.message : 'Unknown error updating order';
    return { success: false, error: message };
  }
}
