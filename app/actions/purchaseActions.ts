'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import type { Order } from '@/types/order';
import { getCurrentUser } from './auth';

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
    // Get current user if available, otherwise use guest flow
    let userId = 'guest';
    try {
      const authData = await getCurrentUser();
      if (authData?.user?.id) {
        userId = authData.user.id;
      }
    } catch (error) {
      console.log('No authenticated user, proceeding as guest');
    }

    // Create order with admin client to bypass RLS
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
      throw new Error('Failed to create order');
    }

    if (!order) {
      throw new Error('No order data returned');
    }

    // Create order items using the admin client
    const orderItems = items.map(item => ({
      order_id: order.id,
      product_id: item.id,
      quantity: Math.round(item.grams),
      price: Number(((item.pricePerKg * item.grams) / 1000).toFixed(2)),
      product_name: item.name
    }));

    const { error: itemsError } = await supabaseAdmin
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      // Cleanup the order if items failed
      await supabaseAdmin.from('orders').delete().eq('id', order.id);
      console.error('Failed to create order items:', itemsError);
      throw new Error('Failed to create order items');
    }

    return { data: order, status: 200 };
  } catch (err) {
    console.error('Purchase order error:', err);
    return {
      error: err instanceof Error ? err.message : 'An unexpected error occurred',
      status: 500
    };
  }
}
