'use server';

import { createClient } from '@/lib/supabase/server';
import { createOrder } from './orderActions';
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
    const supabase = createClient();
    const authData = await getCurrentUser();

    if (!authData?.user || !authData.profile) {
      return { error: 'Authentication required', status: 401 };
    }

    const profile = authData.profile;

    if (!profile?.id) {
      return { error: 'Profile not found', status: 404 };
    }

    const orderData: Order = {
      id: crypto.randomUUID(),
      profile_id: profile.id, // This identifies who created the order
      customer_profile_id: profile.id, // This identifies the customer
      status: 'pending',
      type: 'online',
      total_amount: Number(total.toFixed(2)),
      order_items: items.map(item => ({
        id: crypto.randomUUID(),
        product_id: item.id,
        quantity: Math.max(1, Math.round(item.grams / 1000)),
        price: Number(((item.pricePerKg * item.grams) / 1000).toFixed(2)),
        product_name: item.name,
      })),
    };

    const { data: order, error: orderError } = await createOrder(orderData);

    if (orderError) {
      console.error('Order creation failed:', orderError);
      return {
        error: orderError.message || 'Failed to create order',
        status: 500,
      };
    }

    return { data: order, status: 200 };
  } catch (err: unknown) {
    const error = err as Error & {
      code?: string;
      details?: string;
    };

    console.error('Purchase order error:', error);
    return {
      error: error.message || 'An unexpected error occurred',
      status: 500,
    };
  }
}
