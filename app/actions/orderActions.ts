'use server';

import { createClient } from '@/lib/supabase/server';
import type { Order as FrontendOrder, OrderItem as FrontendOrderItem, ExtendedOrder } from '@/types/order';
import { getUser } from './auth';
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
  whatsappNotification?: {
    success: boolean;
    message?: string;
    method?: string;
    messageId?: string;
    error?: string;
  } | null;
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

export async function getRecentOrders(limit: number = 10): Promise<{ data: FrontendOrder[] | null; error: string | null }> {
  const supabase = await createClient();
  try {
    console.time('[TRACKING DEBUG] Recent orders fetch time');

    // Fetch recent orders with customer profile data and guest information
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select(`
        id, display_id, created_at, updated_at, status, total_amount, type, profile_id, customer_profile_id,
        delivery_cost, coupon_code, discount_amount,
        is_guest_order, guest_name, guest_email, guest_phone, guest_address,
        order_items(id, product_id, quantity, price, product_name),
        customer_profile:profiles!customer_profile_id(
          id, name, email, phone, address, role, status, created_at, updated_at, avatar_url
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (ordersError) {
      console.error('[TRACKING DEBUG] Error fetching recent orders:', ordersError);
      console.timeEnd('[TRACKING DEBUG] Recent orders fetch time');
      return { data: null, error: ordersError.message };
    }

    if (!ordersData || ordersData.length === 0) {
      console.timeEnd('[TRACKING DEBUG] Recent orders fetch time');
      return { data: [], error: null };
    }

    // Map to frontend format
    const mappedOrders: FrontendOrder[] = ordersData.map((orderData: any) => ({
      id: orderData.id,
      profile_id: orderData.profile_id || '',
      customer_profile_id: orderData.customer_profile_id || '',
      total_amount: orderData.total_amount || 0,
      status: orderData.status || 'pending',
      type: orderData.type || 'standard',
      display_id: orderData.display_id || '',
      created_at: orderData.created_at,
      updated_at: orderData.updated_at || '',
      delivery_cost: orderData.delivery_cost || 0,
      coupon_code: orderData.coupon_code || undefined,
      discount_amount: orderData.discount_amount || 0,
      order_items: Array.isArray(orderData.order_items) ? orderData.order_items.map((item: any): FrontendOrderItem => ({
        id: item.id || '',
        product_id: item.product_id,
        product_name: item.product_name || 'Unknown Product',
        quantity: item.quantity || 0,
        price: item.price || 0,
        product: { name: item.product_name || 'Unknown Product' },
        order_id: orderData.id,
      })) : [],
      items: Array.isArray(orderData.order_items) ? orderData.order_items.map((item: any): FrontendOrderItem => ({
        id: item.id || '',
        product_id: item.product_id,
        product_name: item.product_name || 'Unknown Product',
        quantity: item.quantity || 0,
        price: item.price || 0,
        product: { name: item.product_name || 'Unknown Product' },
        order_id: orderData.id,
      })) : [],
      customer: orderData.customer_profile ? {
        id: orderData.customer_profile.id,
        name: orderData.customer_profile.name,
        email: orderData.customer_profile.email,
        phone: orderData.customer_profile.phone,
        role: orderData.customer_profile.role,
      } : {
        id: 'default-customer',
        name: 'Unknown Customer',
        email: 'No Email',
        role: 'customer',
      },
      customer_id: orderData.customer_profile_id || '',
    }));

    console.timeEnd('[TRACKING DEBUG] Recent orders fetch time');
    return { data: mappedOrders, error: null };
  } catch (error) {
    console.error('[TRACKING DEBUG] Error in getRecentOrders:', error);
    console.timeEnd('[TRACKING DEBUG] Recent orders fetch time');
    const message = error instanceof Error ? error.message : 'Unknown error fetching recent orders';
    return { data: null, error: message };
  }
}

export async function getOrderDetails(orderId: string): Promise<{ data: FrontendOrder | null; error: string | null }> {
  const supabase = await createClient();
  try {
    console.time('[DASHBOARD DEBUG] Order details fetch time');

    // Fetch everything in a single query including customer profile data
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select(`
        id, display_id, created_at, updated_at, status, total_amount, type, profile_id, customer_profile_id,
        delivery_cost, coupon_code, discount_amount,
        is_guest_order, guest_name, guest_email, guest_phone, guest_address,
        order_items(id, product_id, quantity, price, product_name),
        customer_profile:profiles!customer_profile_id(
          id, name, email, phone, address, role, status, created_at, updated_at, avatar_url
        )
      `)
      .eq('id', orderId)
      .maybeSingle(); // Use maybeSingle() instead of single() to avoid errors for missing orders

    if (orderError) {
      console.error('[DASHBOARD DEBUG] Error fetching order details:', orderError);
      console.timeEnd('[DASHBOARD DEBUG] Order details fetch time');
      return { data: null, error: orderError.message };
    }

    if (!orderData) {
      console.warn(`[DASHBOARD DEBUG] No order found for ID: ${orderId}`);
      console.timeEnd('[DASHBOARD DEBUG] Order details fetch time');
      return { data: null, error: 'Order not found' };
    }

    // Map DB Row to Frontend Order type safely
    const responseOrder: FrontendOrder = {
      id: orderData.id,
      profile_id: orderData.profile_id || '',
      customer_profile_id: orderData.customer_profile_id || '',
      total_amount: orderData.total_amount || 0,
      status: orderData.status || 'pending',
      type: orderData.type || 'standard',
      display_id: orderData.display_id || '',
      created_at: orderData.created_at,
      updated_at: orderData.updated_at || '',
      delivery_cost: orderData.delivery_cost || 0,
      coupon_code: orderData.coupon_code || undefined,
      discount_amount: orderData.discount_amount || 0,
      // Guest order fields
      is_guest_order: orderData.is_guest_order || false,
      guest_name: orderData.guest_name || undefined,
      guest_email: orderData.guest_email || undefined,
      guest_phone: orderData.guest_phone || undefined,
      guest_address: orderData.guest_address || undefined,
      // Map order_items safely, ensuring it matches FrontendOrderItem[]
      order_items: Array.isArray(orderData.order_items) ? orderData.order_items.map((item: any): FrontendOrderItem => ({
        id: item.id || '',
        product_id: item.product_id,
        product_name: item.product_name || 'Unknown Product',
        quantity: item.quantity || 0,
        price: item.price || 0,
        product: { name: item.product_name || 'Unknown Product' },
        order_id: orderId,
      })) : [],
      // Also set items to the same data for compatibility
      items: Array.isArray(orderData.order_items) ? orderData.order_items.map((item: any): FrontendOrderItem => ({
        id: item.id || '',
        product_id: item.product_id,
        product_name: item.product_name || 'Unknown Product',
        quantity: item.quantity || 0,
        price: item.price || 0,
        product: { name: item.product_name || 'Unknown Product' },
        order_id: orderId,
      })) : [],
      // Use real customer profile data if available
      customer: orderData.customer_profile ? {
        id: orderData.customer_profile.id,
        name: orderData.customer_profile.name,
        email: orderData.customer_profile.email,
        phone: orderData.customer_profile.phone,
        role: orderData.customer_profile.role,
      } : {
        id: 'default-customer',
        name: 'Unknown Customer',
        email: 'No Email',
        role: 'customer',
      },
      customer_id: orderData.customer_profile_id || '',
    };

    console.timeEnd('[DASHBOARD DEBUG] Order details fetch time');
    return { data: responseOrder, error: null };
  } catch (error) {
    console.error('[DASHBOARD DEBUG] Error in getOrderDetails:', error);
    console.timeEnd('[DASHBOARD DEBUG] Order details fetch time');
    const message = error instanceof Error ? error.message : 'Unknown error fetching order details';
    return { data: null, error: message };
  }
}

export async function createOrder(
  items: InputOrderItem[],
  customerId: string,
  totalAmount: number,
  status: string = 'pending',
  deliveryCost: number = 0,
  couponCode: string | null = null,
  discountAmount: number = 0
): Promise<OrderResponse> {
  try {
    const supabase = await createClient();
    const authData = await getUser();
    if (!authData) throw new Error('User not authenticated');
    if (!authData.profile?.role) return { success: false, error: 'Unauthorized: User role not found' };
    const role = authData.profile.role;
    const userId = authData.id;
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

    // IMPORTANT: Force the delivery cost to be the value passed in
    // This is a direct fix to ensure the delivery cost is saved to the database
    const finalDeliveryCost = deliveryCost;

    // Prepare the exact OrderInsert object based on types/supabase.ts
    const orderToInsert: OrderInsert = {
      profile_id,
      customer_profile_id,
      total_amount: totalAmount,
      status: status,
      type: role === 'customer' ? 'self_service' : 'store',
      display_id: display_id || null,
      delivery_cost: finalDeliveryCost, // Use the delivery cost passed in
      coupon_code: couponCode || null,
      discount_amount: discountAmount || 0,
      // id, created_at, updated_at are excluded
    };

    // Use explicit type for insert data to satisfy overload
    const { data: insertedOrderData, error: orderError } = await supabase
      .from('orders')
      .insert(orderToInsert as OrderInsert) // Cast to exact type
      .select()
      .single();

    if (orderError || !insertedOrderData) {
      console.error('Database error creating order:', orderError);
      const message = orderError ? orderError.message : 'Order data unexpectedly null after insert.';
      return { success: false, error: `Database error creating order: ${message}` };
    }
    // Now insertedOrderData is OrderRow
    const orderId = insertedOrderData.id; // Safe access

    // Prepare OrderItemInsert objects strictly
    const orderItemsToInsert: OrderItemInsert[] = items.map(item => ({
      order_id: orderId,
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.price,
      product_name: item.product_name,
      // id is excluded
    }));

    // Use explicit type for insert data
    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItemsToInsert as OrderItemInsert[]); // Cast to exact type

    if (itemsError) {
      console.error('Error creating order items:', { error: itemsError, orderId, items: orderItemsToInsert.length });
      console.log('[DASHBOARD DEBUG] Cleaning up failed order...');
      await supabase.from('orders').delete().eq('id' as any, orderId); // Use 'as any' workaround
      return { success: false, error: `Failed to create order items: ${itemsError.message || 'Unknown error'}` };
    }

    console.log('[DASHBOARD DEBUG] Order items created successfully');

    // Real-time updates will handle UI updates, no need for revalidatePath
    console.log('[DASHBOARD DEBUG] Order creation completed, real-time will handle updates');

    console.log('[DASHBOARD DEBUG] Order creation completed successfully');

    // Send WhatsApp notification for new order and return the result
    let whatsappResult = null;
    try {
      console.log('[NOTIFICATION] 🚀 Sending automatic WhatsApp notification for order:', insertedOrderData.display_id);

      // Import the notification function dynamically to avoid import issues
      const { sendOrderNotificationWhatsApp } = await import('@/lib/whatsapp/order-notifications');

      // Fetch actual customer data for notifications
      let customerData = { name: 'Customer', phone: '+251944113998', email: undefined };
      
      if (customer_profile_id) {
        try {
          const { data: customerProfile } = await supabase
            .from('profiles')
            .select('name, phone, email')
            .eq('id', customer_profile_id)
            .single();
            
          if (customerProfile) {
            customerData = {
              name: customerProfile.name || 'Customer',
              phone: customerProfile.phone || '+251944113998',
              email: customerProfile.email || undefined
            };
          }
        } catch (error) {
          console.warn('⚠️ Could not fetch customer data for notifications:', error);
        }
      }

      // Prepare notification data
      const notificationData = {
        id: insertedOrderData.id,
        display_id: insertedOrderData.display_id || `ORD-${Date.now()}`,
        customer_name: customerData.name,
        customer_phone: customerData.phone,
        customer_email: customerData.email,
        delivery_address: undefined,
        items: orderItemsToInsert.map(item => ({
          product_name: item.product_name,
          quantity: item.quantity,
          price: item.price
        })),
        total_amount: insertedOrderData.total_amount,
        delivery_cost: finalDeliveryCost,
        discount_amount: discountAmount,
        created_at: insertedOrderData.created_at,
        status: insertedOrderData.status,
        type: insertedOrderData.type
      };

      console.log('[NOTIFICATION] 📋 Notification data prepared:', {
        orderId: notificationData.display_id,
        customer: notificationData.customer_name,
        itemCount: notificationData.items.length,
        total: notificationData.total_amount
      });

      // Wait for notification result so we can return WhatsApp URLs to the UI
      whatsappResult = await sendOrderNotificationWhatsApp(notificationData);
      
      if (whatsappResult.success) {
        if (whatsappResult.messageId) {
          console.log('✅ [NOTIFICATION] Automatic WhatsApp notification sent successfully!', {
            messageId: whatsappResult.messageId,
            method: whatsappResult.method
          });
        } else {
          console.log('📱 [NOTIFICATION] WhatsApp notification completed');
        }
      } else {
        console.warn('⚠️ [NOTIFICATION] WhatsApp notification failed:', whatsappResult.error);
      }
    } catch (error) {
      console.error('💥 [NOTIFICATION] Failed to send WhatsApp notification:', error);
      // Don't fail the order creation if notification fails
      whatsappResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown notification error'
      };
    }

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
      whatsappNotification: whatsappResult // Include WhatsApp notification result
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
    // Check user authentication and role
    const authData = await getUser();
    if (!authData) {
      return { success: false, error: 'Authentication required' };
    }

    // Only admins can delete orders
    if (authData.profile?.role !== 'admin') {
      return { success: false, error: 'Insufficient permissions. Only administrators can delete orders.' };
    }

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

    // Real-time updates will handle UI updates, no need for revalidatePath
    console.log('[DASHBOARD DEBUG] Order deletion completed, real-time will handle updates');
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
export async function getOrders(customerId?: string, caller?: string): Promise<ExtendedOrder[]> {
  const supabase = await createClient();
  try {
    const authData = await getUser();
    if (!authData) throw new Error('Not authenticated');

    let query = supabase
      .from('orders')
      .select(`id, display_id, created_at, updated_at, status, total_amount, type, profile_id, customer_profile_id, is_guest_order, guest_name, guest_email, guest_phone, guest_address, order_items!order_items_order_id_fkey (*, products!inner (*)), customer:profiles!orders_customer_profile_id_fkey (id, name, email, phone, role), seller:profiles!orders_profile_id_fkey (id, name, email, role)`)
      .order('created_at', { ascending: false });

    // Apply role-based filtering with type assertions to fix TypeScript errors
    if (authData.profile?.role === 'admin') {
      /* No filter - admin sees all orders */
    }
    else if (authData.profile?.role === 'sales') {
      // Sales users should see all orders (or filter by pending status if needed)
      // query = query.in('status', ['pending', 'confirmed', 'processing']) as any;
      /* No filter - sales sees all orders like admin */
    }
    else if (authData.profile?.role === 'customer') {
      query = query.eq('customer_profile_id', authData.id) as any; // Type assertion after the method call
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
    // Cast the result to our known type and map to ExtendedOrder
    return orders.map(order => {
      // Map order items first
      const orderItems: FrontendOrderItem[] = (order.order_items ?? []).map(item => ({
        id: item.id,
        product_id: item.product_id,
        product_name: item.product_name || item.products?.name || 'Unknown Product',
        quantity: item.quantity,
        price: item.price,
        order_id: order.id,
        product: item.products ? { name: item.products.name } : undefined
      }));

      // Map to ExtendedOrder
      const mappedOrder: ExtendedOrder = {
        id: order.id,
        profile_id: order.profile_id,
        customer_profile_id: order.customer_profile_id ?? '',
        total_amount: order.total_amount,
        status: order.status,
        type: order.type,
        display_id: order.display_id ?? undefined,
        created_at: order.created_at,
        updated_at: order.updated_at ?? null,
        customer_id: order.customer_profile_id ?? '',
        // Guest order fields
        is_guest_order: (order as any).is_guest_order ?? false,
        guest_name: (order as any).guest_name ?? undefined,
        guest_email: (order as any).guest_email ?? undefined,
        guest_phone: (order as any).guest_phone ?? undefined,
        guest_address: (order as any).guest_address ?? undefined,
        customer: order.customer ? {
          id: order.customer.id,
          name: order.customer.name,
          email: order.customer.email,
          role: order.customer.role,
          phone: order.customer.phone || null
        } : undefined,
        profiles: order.seller ? {
          id: order.seller.id,
          name: order.seller.name,
          email: order.seller.email,
          role: order.seller.role,
          phone: order.seller.phone ?? null,
          avatar_url: order.seller.avatar_url ?? null
        } : undefined,
        order_items: orderItems,
        items: orderItems,
      };

      return mappedOrder;
    });
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

    // Real-time updates will handle UI updates, no need for revalidatePath
    console.log('[DASHBOARD DEBUG] Order status update completed, real-time will handle updates');

    // Send WhatsApp notification for status update
    try {
      console.log('[NOTIFICATION] Attempting to send status update notification...');

      const { sendOrderStatusUpdateWhatsApp } = await import('@/lib/whatsapp/order-notifications');

      // Fetch customer data for status update notification
      let customerData = { name: 'Customer', phone: '+251944113998', email: undefined };
      
      if (updatedOrder.customer_profile_id) {
        try {
          const { data: customerProfile } = await supabase
            .from('profiles')
            .select('name, phone, email')
            .eq('id', updatedOrder.customer_profile_id)
            .single();
            
          if (customerProfile) {
            customerData = {
              name: customerProfile.name || 'Customer',
              phone: customerProfile.phone || '+251944113998',
              email: customerProfile.email || undefined
            };
          }
        } catch (error) {
          console.warn('⚠️ Could not fetch customer data for status notification:', error);
        }
      }

      // Create notification data structure with actual customer data
      const notificationData = {
        id: orderId,
        display_id: updatedOrder.display_id || `ORD-${Date.now()}`,
        customer_name: customerData.name,
        customer_phone: customerData.phone,
        items: [],
        total_amount: updatedOrder.total_amount,
        created_at: updatedOrder.created_at,
        status: updatedOrder.status,
        type: updatedOrder.type
      };

      // Send notification in background
      sendOrderStatusUpdateWhatsApp(notificationData, 'previous', validStatus)
        .then(result => {
          if (result.success) {
            console.log('✅ [NOTIFICATION] Status update notification sent successfully');
          } else {
            console.warn('⚠️ [NOTIFICATION] Status update notification failed:', result.error);
          }
        })
        .catch(error => {
          console.error('❌ [NOTIFICATION] Status update notification error:', error);
        });

    } catch (error) {
      console.error('[NOTIFICATION] Failed to initiate status update notification:', error);
    }

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
      .select();

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

    // Real-time updates will handle UI updates, no need for revalidatePath
    console.log('[DASHBOARD DEBUG] Order update completed, real-time will handle updates');

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
