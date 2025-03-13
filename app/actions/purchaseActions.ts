'use server';

import { createClient } from '@/lib/supabase/server';
import { createOrder } from './orderActions';
import type { Order, OrderItem } from '@/types/order';
import { getCurrentUser } from './auth';
import crypto from 'crypto';

/**
 * Handles purchase orders from the marketing page
 * - Modified with more robust error handling and direct database access
 */
export async function handlePurchaseOrder(
  items: {
    id: string;
    name: string;
    pricePerKg: number;
    grams: number;
  }[],
  total: number,
) {
  console.log('🔄 handlePurchaseOrder called with:', { itemCount: items.length, total });

  try {
    // Use await with createClient() to get the SupabaseClient instance
    const supabase = await createClient();

    // Try to insert directly into the database to bypass potential middleware issues
    try {
      // Create a basic order first
      const randomId = crypto.randomUUID();
      const now = new Date().toISOString();
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          id: randomId,
          profile_id: 'guest',
          customer_profile_id: 'guest',
          status: 'pending',
          type: 'online',
          total_amount: Number(total.toFixed(2)),
          created_at: now,
          updated_at: now
        })
        .select()
        .single();

      if (orderError) {
        console.error('❌ Direct order insertion failed:', orderError);
        // Check for RLS error
        if (orderError.message.includes('policy')) {
          return {
            error: `Permission denied: ${orderError.message}`,
            status: 403,
          };
        }

        // Continue with the regular approach
        console.log('⚠️ Falling back to regular order creation approach');
      } else {
        console.log('✅ Direct order insertion succeeded:', order?.id);

        // Create order items
        const orderItems = items.map(item => ({
          id: crypto.randomUUID(),
          order_id: randomId,
          product_id: item.id,
          quantity: Math.max(1, Math.round(item.grams)),
          price: Number(((item.pricePerKg * item.grams) / 1000).toFixed(2)),
          product_name: item.name,
          created_at: now,
          updated_at: now
        }));

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems);

        if (itemsError) {
          console.error('❌ Order items creation failed:', itemsError);
          // Try to clean up the order if items failed
          await supabase.from('orders').delete().eq('id', randomId);
          // Continue with the regular approach
        } else {
          return {
            data: order,
            status: 200
          };
        }
      }
    } catch (directError) {
      console.error('❌ Direct DB access error:', directError);
    }

    // Regular approach as fallback
    // First try to get the authenticated user
    let authData = null;
    try {
      authData = await getCurrentUser();
      console.log('👤 Auth data retrieved:', {
        hasUser: !!authData?.user,
        hasProfile: !!authData?.profile,
        role: authData?.profile?.role || 'unknown'
      });
    } catch (authError) {
      console.error('🔒 Auth error:', authError);
      // Continue with a fallback approach if auth fails
    }

    // If no authentication, create with a guest approach
    let userId = 'guest';
    let userProfile = null;

    if (authData?.user) {
      userId = authData.user.id;
      userProfile = authData.profile;
    }

    console.log('👤 Using userId:', userId);

    // Create the order with minimal required fields
    const orderData: Order = {
      id: crypto.randomUUID(),
      profile_id: userId,
      customer_profile_id: userId,
      status: 'pending',
      type: 'online',
      total_amount: Number(total.toFixed(2)),
      order_items: items.map(item => ({
        id: crypto.randomUUID(),
        order_id: '', // Will be filled in by createOrder
        product_id: item.id,
        quantity: Math.round(item.grams), // Use grams directly
        price: Number(((item.pricePerKg * item.grams) / 1000).toFixed(2)),
        product_name: item.name,
      })),
    };

    console.log('📦 Submitting order data:', {
      userId,
      itemCount: orderData.order_items.length,
      total: orderData.total_amount
    });

    // Call the createOrder function
    const { data: order, error: orderError } = await createOrder(orderData);

    if (orderError) {
      console.error('❌ Order creation failed:', orderError);
      return {
        error: `Failed to create order: ${orderError.message || 'Unknown error'}`,
        status: 500,
      };
    }

    console.log('✅ Order created successfully:', order?.id);
    return { data: order, status: 200 };
  } catch (err: unknown) {
    const error = err as Error;

    console.error('❌ Purchase order unexpected error:', {
      message: error.message,
      stack: error.stack
    });

    return {
      error: error.message || 'An unexpected error occurred',
      status: 500,
    };
  }
}
