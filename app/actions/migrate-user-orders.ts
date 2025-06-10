'use server';

import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Utility function to ensure orders have correct customer_profile_id
 * This should be run once to fix any historical data inconsistencies
 */
export async function migrateUserOrders() {
  try {
    const supabaseAdmin = createAdminClient();

    // Get all orders that might have incorrect customer_profile_id
    const { data: orders, error: ordersError } = await supabaseAdmin
      .from('orders')
      .select('id, profile_id, customer_profile_id')
      .is('customer_profile_id', null);

    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
      return { success: false, error: ordersError.message };
    }

    if (!orders || orders.length === 0) {
      return { success: true, message: 'No orders need migration', updated: 0 };
    }

    // Update orders to set customer_profile_id = profile_id where customer_profile_id is null
    const { error: updateError, count } = await supabaseAdmin
      .from('orders')
      .update({ customer_profile_id: supabaseAdmin.raw('profile_id') })
      .is('customer_profile_id', null);

    if (updateError) {
      console.error('Error updating orders:', updateError);
      return { success: false, error: updateError.message };
    }

    return { 
      success: true, 
      message: `Successfully updated ${count || 0} orders`,
      updated: count || 0
    };

  } catch (error) {
    console.error('Unexpected error in migrateUserOrders:', error);
    return { 
      success: false, 
      error: 'Unexpected error occurred'
    };
  }
}

/**
 * Fix specific user's orders to ensure they can see them after role change
 */
export async function fixUserOrderAccess(userId: string) {
  try {
    const supabaseAdmin = createAdminClient();

    // Update all orders where this user is the profile_id but customer_profile_id is different or null
    const { error: updateError, count } = await supabaseAdmin
      .from('orders')
      .update({ customer_profile_id: userId })
      .eq('profile_id', userId)
      .neq('customer_profile_id', userId);

    if (updateError) {
      console.error('Error fixing user orders:', updateError);
      return { success: false, error: updateError.message };
    }

    return { 
      success: true, 
      message: `Fixed access to ${count || 0} orders for user`,
      updated: count || 0
    };

  } catch (error) {
    console.error('Unexpected error in fixUserOrderAccess:', error);
    return { 
      success: false, 
      error: 'Unexpected error occurred'
    };
  }
}