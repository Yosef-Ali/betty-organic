'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import type { Order } from '@/types/order';
import { getCurrentUser } from './auth';
import { v4 as uuidv4 } from 'uuid';
import { orderIdService } from '@/app/services/orderIdService';
import { revalidatePath } from 'next/cache';

export async function handlePurchaseOrder(
  items: {
    id: string;
    name: string;
    pricePerKg: number;
    grams: number;
  }[],
  total: number,
) {
  try {
    console.log('[ORDER DEBUG] Starting order creation with items:', JSON.stringify(items));
    console.log('[ORDER DEBUG] Total amount:', total);

    // Get current user if available, otherwise use guest flow
    let userId = uuidv4(); // Generate a unique ID for guest users
    try {
      const authData = await getCurrentUser();
      console.log('[ORDER DEBUG] Auth data:', JSON.stringify(authData));
      if (authData?.user?.id) {
        userId = authData.user.id;
      }
    } catch (error) {
      console.log('[ORDER DEBUG] No authenticated user, proceeding as guest:', error);
    }

    // Validate items before creating order
    if (!items || items.length === 0) {
      console.error('[ORDER DEBUG] No items provided for order');
      return {
        error: 'No items provided for order',
        status: 400
      };
    }

    // Generate a display ID for the order
    const display_id = await orderIdService.generateOrderID();
    console.log('[ORDER DEBUG] Generated order ID:', display_id);

    // Create order with admin client to bypass RLS
    console.log('[ORDER DEBUG] Creating order with data:', {
      profile_id: userId,
      customer_profile_id: userId,
      status: 'pending',
      type: 'online',
      total_amount: Number(total.toFixed(2)),
      display_id
    });

    // First, ensure the user exists in the profiles table
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (profileError && profileError.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('[ORDER DEBUG] Error checking profile:', profileError);
      return {
        error: 'Failed to check user profile',
        status: 500
      };
    }

    // If profile doesn't exist, create it
    if (!profile) {
      console.log('[ORDER DEBUG] Creating new profile for user:', userId);
      const { error: createProfileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: userId,
          role: 'customer',
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (createProfileError) {
        console.error('[ORDER DEBUG] Failed to create profile:', createProfileError);
        return {
          error: 'Failed to create user profile',
          status: 500
        };
      }
      console.log('[ORDER DEBUG] New profile created successfully');
    }

    // Now create the order
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        profile_id: userId,
        customer_profile_id: userId,
        status: 'pending',
        type: 'online',
        total_amount: Number(total.toFixed(2)),
        display_id,
      })
      .select()
      .single();

    if (orderError) {
      console.error('[ORDER DEBUG] Failed to create order:', orderError);
      return {
        error: `Failed to create order: ${orderError.message}`,
        status: 500
      };
    }

    if (!order) {
      console.error('[ORDER DEBUG] No order data returned from insert');
      return {
        error: 'No order data returned',
        status: 500
      };
    }

    console.log('[ORDER DEBUG] Order created successfully:', order);

    // Create order items using the admin client
    const orderItems = items.map(item => ({
      order_id: order.id,
      product_id: item.id,
      quantity: Math.round(item.grams),
      price: Number(((item.pricePerKg * item.grams) / 1000).toFixed(2)),
      product_name: item.name
    }));

    console.log('[ORDER DEBUG] Creating order items:', JSON.stringify(orderItems));

    const { error: itemsError } = await supabaseAdmin
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('[ORDER DEBUG] Failed to create order items:', itemsError);
      // Cleanup the order if items failed
      await supabaseAdmin.from('orders').delete().eq('id', order.id);
      return {
        error: `Failed to create order items: ${itemsError.message}`,
        status: 500
      };
    }

    console.log('[ORDER DEBUG] Order items created successfully');

    // Revalidate the dashboard paths to show the new order
    revalidatePath('/dashboard/orders');
    revalidatePath('/dashboard');

    return { data: order, status: 200 };
  } catch (err) {
    console.error('[ORDER DEBUG] Purchase order error:', err);
    return {
      error: err instanceof Error ? err.message : 'An unexpected error occurred',
      status: 500
    };
  }
}
