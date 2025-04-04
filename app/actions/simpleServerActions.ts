'use server';

import { createClient } from '@/lib/supabase/server';

/**
 * A simple server action to test if server actions are working
 */
export async function testServerAction() {
  try {
    return {
      success: true,
      message: 'Server action is working correctly',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error in test server action:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * A simple server action to fetch pending orders
 */
export async function fetchPendingOrders() {
  try {
    const supabase = await createClient();
    
    const { data, error, count } = await supabase
      .from('orders')
      .select('id, status, created_at', { count: 'exact' })
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) {
      throw new Error(error.message);
    }
    
    return {
      success: true,
      orders: data || [],
      count: count || 0
    };
  } catch (error) {
    console.error('Error fetching pending orders:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      orders: [],
      count: 0
    };
  }
}

/**
 * A simple server action to create a test order
 */
export async function createTestOrder() {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('Authentication required');
    }
    
    // Create a test order
    const { data, error } = await supabase
      .from('orders')
      .insert({
        profile_id: user.id,
        customer_profile_id: user.id,
        total_amount: 0.01,
        status: 'pending',
        type: 'test',
        display_id: `TEST-${Date.now().toString().slice(-6)}`,
      })
      .select()
      .single();
    
    if (error) {
      throw new Error(error.message);
    }
    
    return {
      success: true,
      message: 'Test order created successfully',
      order: data
    };
  } catch (error) {
    console.error('Error creating test order:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
