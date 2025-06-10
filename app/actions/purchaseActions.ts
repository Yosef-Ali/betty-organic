'use server';

import { createClient } from '@/lib/supabase/server';
import type { Order } from '@/types/order';
import { getUser } from './auth';
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
    // Input validation
    if (!items?.length) {
      return {
        error: 'No items provided for order',
        status: 400
      };
    }

    if (!total || total <= 0) {
      return {
        error: 'Invalid total amount',
        status: 400
      };
    }

    // Get current user if available, otherwise use guest flow
    let userId: string;
    let userRole = 'customer';
    let userEmail: string;
    try {
      const authData = await getUser();
      if (authData) {
        userId = authData.id;
        userRole = authData.profile?.role || 'customer';
        userEmail = authData.email || `${userId}@guest.bettyorganic.com`;
      } else {
        userId = uuidv4(); // Generate a unique ID for guest users
        userEmail = `guest-${userId}@guest.bettyorganic.com`;
      }
    } catch (error) {
      userId = uuidv4();
      userEmail = `guest-${userId}@guest.bettyorganic.com`;
    }

    // Generate a display ID for the order
    const display_id = await orderIdService.generateOrderID();

    // Get Supabase client
    const supabase = await createClient();

    // First, ensure the user exists in the profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (profileError && profileError.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Error checking profile:', profileError);
      return {
        error: 'Failed to check user profile',
        status: 500
      };
    }

    // If profile doesn't exist, create it
    if (!profile) {
      const { error: createProfileError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: userEmail,
          role: userRole,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (createProfileError) {
        console.error('Failed to create profile:', createProfileError);
        return {
          error: 'Failed to create user profile',
          status: 500
        };
      }
    }

    // Now create the order with required fields
    const orderData = {
      profile_id: userId,
      customer_profile_id: userId,
      status: 'pending',
      type: 'online',
      total_amount: Number(total.toFixed(2)),
      display_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert(orderData)
      .select()
      .single();

    if (orderError) {
      console.error('Failed to create order:', orderError);
      return {
        error: `Failed to create order: ${orderError.message}`,
        status: 500
      };
    }

    if (!order) {
      console.error('No order data returned from insert');
      return {
        error: 'No order data returned',
        status: 500
      };
    }

    // Create order items using the admin client
    const orderItems = items.map(item => ({
      order_id: order.id,
      product_id: item.id,
      quantity: Math.round(item.grams),
      price: Number(((item.pricePerKg * item.grams) / 1000).toFixed(2)),
      product_name: item.name
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('Failed to create order items:', itemsError);
      // Cleanup the order if items failed
      await supabase.from('orders').delete().eq('id', order.id);
      return {
        error: `Failed to create order items: ${itemsError.message}`,
        status: 500
      };
    }

    // Revalidate the dashboard paths to show the new order
    revalidatePath('/dashboard/orders');
    revalidatePath('/dashboard');

    return { data: order, status: 200 };
  } catch (err) {
    console.error('Purchase order error:', err);
    return {
      error: err instanceof Error ? err.message : 'An unexpected error occurred',
      status: 500
    };
  }
}

export async function handleGuestOrder(
  items: {
    id: string;
    name: string;
    pricePerKg: number;
    grams: number;
  }[],
  total: number,
  customerInfo: {
    name: string;
    phone: string;
    address: string;
  }
) {
  try {
    // Input validation
    if (!items?.length) {
      return {
        error: 'No items provided for order',
        status: 400
      };
    }

    if (!total || total <= 0) {
      return {
        error: 'Invalid total amount',
        status: 400
      };
    }

    if (!customerInfo.phone || !customerInfo.address) {
      return {
        error: 'Phone number and delivery address are required',
        status: 400
      };
    }

    // Create a guest user ID
    const guestUserId = uuidv4();
    const guestEmail = `guest-${guestUserId}@guest.bettyorganic.com`;

    // Generate a display ID for the order
    const display_id = await orderIdService.generateOrderID();

    // Get Supabase client
    const supabase = await createClient();

    // Create a guest profile
    const { error: createProfileError } = await supabase
      .from('profiles')
      .insert({
        id: guestUserId,
        email: guestEmail,
        name: customerInfo.name || 'Guest Customer',
        phone: customerInfo.phone,
        address: customerInfo.address,
        role: 'customer',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (createProfileError) {
      console.error('Failed to create guest profile:', createProfileError);
      return {
        error: 'Failed to create guest profile',
        status: 500
      };
    }

    // Create the order
    const orderData = {
      profile_id: guestUserId,
      customer_profile_id: guestUserId,
      status: 'pending',
      type: 'online',
      total_amount: Number(total.toFixed(2)),
      display_id,
      delivery_address: customerInfo.address,
      customer_phone: customerInfo.phone,
      customer_name: customerInfo.name || 'Guest Customer',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert(orderData)
      .select()
      .single();

    if (orderError) {
      console.error('Failed to create guest order:', orderError);
      return {
        error: `Failed to create order: ${orderError.message}`,
        status: 500
      };
    }

    if (!order) {
      console.error('No order data returned from insert');
      return {
        error: 'No order data returned',
        status: 500
      };
    }

    // Create order items
    const orderItems = items.map(item => ({
      order_id: order.id,
      product_id: item.id,
      quantity: Math.round(item.grams),
      price: Number(((item.pricePerKg * item.grams) / 1000).toFixed(2)),
      product_name: item.name
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('Failed to create guest order items:', itemsError);
      // Cleanup the order if items failed
      await supabase.from('orders').delete().eq('id', order.id);
      await supabase.from('profiles').delete().eq('id', guestUserId);
      return {
        error: `Failed to create order items: ${itemsError.message}`,
        status: 500
      };
    }

    // Revalidate the dashboard paths to show the new order
    revalidatePath('/dashboard/orders');
    revalidatePath('/dashboard');

    return { data: order, status: 200 };
  } catch (err) {
    console.error('Guest order error:', err);
    return {
      error: err instanceof Error ? err.message : 'An unexpected error occurred',
      status: 500
    };
  }
}
