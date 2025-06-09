'use server';

import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/supabase';
import { isOrderPending } from '@/app/utils/notificationUtils';

// Type for notification orders with role context
export type RoleBasedNotificationOrder = {
  id: string;
  status: string;
  created_at: string;
  display_id?: string | null;
  total_amount?: number;
  profile_id: string;
  customer_profile_id?: string | null;
  type?: string;
  // Customer information for sales/admin
  customer_name?: string;
  customer_email?: string;
};

// Type for the response from role-based notification fetch
export type RoleBasedNotificationResponse = {
  success: boolean;
  orders: RoleBasedNotificationOrder[];
  notifications: RoleBasedNotificationOrder[]; // For backwards compatibility
  count: number;
  error?: string;
  userRole?: 'admin' | 'sales' | 'customer';
};

/**
 * Fetches notifications based on user role
 * @param userId The user ID
 * @param userRole The user's role
 * @returns Role-appropriate notifications
 */
export async function fetchRoleBasedNotifications(
  userId?: string,
  userRole?: 'admin' | 'sales' | 'customer'
): Promise<RoleBasedNotificationResponse> {
  try {
    const supabase = await createClient();

    if (!userId || !userRole) {
      return {
        success: false,
        orders: [],
        notifications: [],
        count: 0,
        error: 'User ID and role are required'
      };
    }

    let query;
    
    if (userRole === 'customer') {
      // Customers only see their own orders
      query = supabase
        .from('orders')
        .select(`
          id, display_id, status, created_at, total_amount, 
          profile_id, customer_profile_id, type
        `)
        .eq('customer_profile_id', userId);
        
    } else if (userRole === 'sales') {
      // Sales team sees all pending orders with customer info
      query = supabase
        .from('orders')
        .select(`
          id, display_id, status, created_at, total_amount, 
          profile_id, customer_profile_id, type,
          profiles!customer_profile_id(name, email)
        `)
        .in('status', ['pending', 'new', 'processing']);
        
    } else if (userRole === 'admin') {
      // Admin sees all orders with customer info
      query = supabase
        .from('orders')
        .select(`
          id, display_id, status, created_at, total_amount, 
          profile_id, customer_profile_id, type,
          profiles!customer_profile_id(name, email)
        `);
    } else {
      return {
        success: false,
        orders: [],
        notifications: [],
        count: 0,
        error: 'Invalid user role'
      };
    }

    const { data: allOrders, error } = await query
      .order('created_at', { ascending: false })
      .limit(50);

    console.log(`[NOTIFICATIONS DEBUG] Role: ${userRole}, Raw orders fetched:`, allOrders?.length || 0);
    console.log(`[NOTIFICATIONS DEBUG] First few orders:`, allOrders?.slice(0, 3));

    if (error) {
      console.error('Error fetching role-based notifications:', error);
      return {
        success: false,
        orders: [],
        notifications: [],
        count: 0,
        error: `Failed to load notifications: ${error.message}`
      };
    }

    // Filter for relevant orders based on role
    let relevantOrders = allOrders || [];
    
    if (userRole === 'customer') {
      // Customers see pending orders only
      relevantOrders = relevantOrders.filter(order => 
        isOrderPending(order.status)
      );
    } else if (userRole === 'sales') {
      // Sales team sees pending/new orders (already filtered in query)
      relevantOrders = relevantOrders.filter(order => 
        ['pending', 'new', 'processing'].includes(order.status?.toLowerCase())
      );
    }
    // Admin sees all orders (no additional filtering)

    // Transform data to include customer info for sales/admin
    const transformedOrders = relevantOrders.map(order => ({
      ...order,
      customer_name: (order as any).profiles?.name || 'Unknown Customer',
      customer_email: (order as any).profiles?.email || null,
    })) as RoleBasedNotificationOrder[];

    console.log(`[NOTIFICATIONS DEBUG] Final filtered orders for ${userRole}:`, transformedOrders.length);
    console.log(`[NOTIFICATIONS DEBUG] Final orders:`, transformedOrders.slice(0, 2));

    return {
      success: true,
      orders: transformedOrders,
      notifications: transformedOrders, // For backwards compatibility
      count: transformedOrders.length,
      userRole
    };

  } catch (error) {
    console.error('Failed to fetch role-based notifications:', error);
    return {
      success: false,
      orders: [],
      notifications: [],
      count: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get notification summary by role
 * @param userId The user ID  
 * @param userRole The user's role
 * @returns Summary of notifications
 */
export async function getNotificationSummary(
  userId?: string,
  userRole?: 'admin' | 'sales' | 'customer'
) {
  try {
    const response = await fetchRoleBasedNotifications(userId, userRole);
    
    if (!response.success) {
      return response;
    }

    const summary = {
      totalCount: response.count,
      pendingCount: response.orders.filter(order => 
        ['pending', 'new'].includes(order.status?.toLowerCase())
      ).length,
      processingCount: response.orders.filter(order => 
        order.status?.toLowerCase() === 'processing'
      ).length,
      todayCount: response.orders.filter(order => {
        const orderDate = new Date(order.created_at);
        const today = new Date();
        return orderDate.toDateString() === today.toDateString();
      }).length,
    };

    return {
      success: true,
      summary,
      userRole
    };

  } catch (error) {
    console.error('Failed to get notification summary:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}