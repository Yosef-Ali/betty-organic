'use server';

import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/supabase';
import { isOrderPending } from '@/app/utils/notificationUtils';

// Type for notification orders
export type NotificationOrder = {
  id: string;
  status: string;
  created_at: string;
  display_id?: string | null;
  total_amount?: number;
  profile_id: string;
  customer_profile_id?: string | null;
};

// Type for the response from fetchPendingOrdersForNotification
export type PendingOrdersResponse = {
  success: boolean;
  orders: NotificationOrder[];
  count: number;
  error?: string;
};

/**
 * Fetches pending orders for the notification bell
 * @param userId Optional user ID to filter orders by customer
 * @returns Array of pending orders and count
 */
export async function fetchPendingOrdersForNotification(userId?: string): Promise<PendingOrdersResponse> {
  try {
    const supabase = await createClient();

    // Create a query that works whether user is authenticated or not
    let query = supabase
      .from('orders')
      .select(
        'id, display_id, status, created_at, total_amount, profile_id, customer_profile_id',
        { count: 'exact' }
      );

    // If we have a user ID, filter by customer_profile_id for better security
    if (userId) {
      query = query.eq('customer_profile_id', userId);
    }

    const { data: allOrders, error, count } = await query
      .order('created_at', { ascending: false })
      .limit(50);

    // Check for error first
    if (error) {
      console.error('Error fetching orders for notification:', error);
      return {
        success: false,
        orders: [],
        count: 0,
        error: `Failed to load orders: ${error.message || 'Unknown error'}`
      };
    }

    // Filter for pending orders in JavaScript (case insensitive)
    const pendingOrders = allOrders?.filter((order: any) => {
      if (!order.status || typeof order.status !== 'string') return false;

      const status = order.status.toLowerCase();
      // Check for various forms of pending status
      return (
        status === 'pending' ||
        status.includes('pending') ||
        status === 'new' ||
        status === 'processing'
      );
    }) || [];

    return {
      success: true,
      orders: pendingOrders as NotificationOrder[],
      count: pendingOrders.length
    };
  } catch (error) {
    console.error('Failed to fetch pending orders for notification:', error);
    return {
      success: false,
      orders: [],
      count: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Creates a test pending order for notification testing
 * @param userId The user ID to associate with the order
 * @returns The created order
 */
export async function createTestNotificationOrder(userId: string) {
  try {
    const supabase = await createClient();

    // Create a test order
    const { data, error } = await supabase
      .from('orders')
      .insert({
        profile_id: userId,
        customer_profile_id: userId,
        total_amount: 99.99,
        status: 'pending',
        type: 'test',
        display_id: `TEST-${Date.now().toString().slice(-6)}`,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating test notification order:', error);
      throw error;
    }

    return {
      success: true,
      order: data
    };
  } catch (error) {
    console.error('Failed to create test notification order:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Note: We can't re-export non-async functions from a server actions file
// Import isOrderPending directly from utils in components that need it
