'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import type { Order } from '@/types/order';
import { getCurrentUser } from './auth';
import { v4 as uuidv4 } from 'uuid';

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
    console.log('Starting order creation with items:', JSON.stringify(items));
    console.log('Total amount:', total);

    // Get current user if available, otherwise use guest flow
    let userId = uuidv4(); // Generate a unique ID for guest users
    try {
      const authData = await getCurrentUser();
      console.log('Auth data:', authData);
      if (authData?.user?.id) {
        userId = authData.user.id;
      }
    } catch (error) {
      console.log('No authenticated user, proceeding as guest:', error);
    }

    // Validate items before creating order
    if (!items || items.length === 0) {
      throw new Error('No items provided for order');
    }

    // Create order with admin client to bypass RLS
    console.log('Creating order with data:', {
      profile_id: userId,
      customer_profile_id: userId,
      status: 'pending',
      type: 'online',
      total_amount: Number(total.toFixed(2))
    });

    // First, ensure the user exists in the profiles table
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (profileError && profileError.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Error checking profile:', profileError);
      throw new Error('Failed to check user profile');
    }

    // If profile doesn't exist, create it
    if (!profile) {
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
        console.error('Failed to create profile:', createProfileError);
        throw new Error('Failed to create user profile');
      }
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
      })
      .select()
      .single();

    if (orderError) {
      console.error('Failed to create order:', orderError);
      throw new Error(`Failed to create order: ${orderError.message}`);
    }

    if (!order) {
      console.error('No order data returned from insert');
      throw new Error('No order data returned');
    }

    console.log('Order created successfully:', order);

    // Create order items using the admin client
    const orderItems = items.map(item => ({
      order_id: order.id,
      product_id: item.id,
      quantity: Math.round(item.grams),
      price: Number(((item.pricePerKg * item.grams) / 1000).toFixed(2)),
      product_name: item.name
    }));

    console.log('Creating order items:', JSON.stringify(orderItems));

    const { error: itemsError } = await supabaseAdmin
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('Failed to create order items:', itemsError);
      // Cleanup the order if items failed
      await supabaseAdmin.from('orders').delete().eq('id', order.id);
      throw new Error(`Failed to create order items: ${itemsError.message}`);
    }

    console.log('Order items created successfully');
    return { data: order, status: 200 };
  } catch (err) {
    console.error('Purchase order error:', err);
    return {
      error: err instanceof Error ? err.message : 'An unexpected error occurred',
      status: 500
    };
  }
}
