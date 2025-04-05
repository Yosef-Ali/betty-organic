'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/client';

// Fallback function to use regular client when admin client is not available
function getSupabaseClient() {
  try {
    return createAdminClient();
  } catch (error) {
    console.warn('Admin client not available, falling back to regular client');
    return createClient();
  }
}

/**
 * Creates a test pending order using an admin user
 * This action doesn't require authentication and is for testing only
 */
export async function createTestPendingOrderForDebug() {
  try {
    // Get the client (admin if available, regular if not)
    const supabaseAdmin = getSupabaseClient();

    // Find an admin user
    const { data: adminUsers, error: adminError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('role', 'admin')
      .limit(1);

    if (adminError) {
      console.error('Error finding admin user:', adminError);
      return {
        success: false,
        error: `Failed to find admin user: ${adminError.message}`
      };
    }

    if (!adminUsers || adminUsers.length === 0) {
      return {
        success: false,
        error: 'No admin users found in the database'
      };
    }

    const adminId = adminUsers[0].id;

    // Create a test order with admin client to bypass RLS
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        profile_id: adminId,
        customer_profile_id: adminId,
        total_amount: 99.99,
        status: 'pending',
        type: 'test',
        display_id: `TEST-${Date.now().toString().slice(-6)}`,
      })
      .select()
      .single();

    if (orderError) {
      console.error('Error creating test order:', orderError);
      return {
        success: false,
        error: `Failed to create test order: ${orderError.message}`
      };
    }

    return {
      success: true,
      order
    };
  } catch (error) {
    console.error('Failed to create test order:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Fetches pending orders for testing
 * This action doesn't require authentication and is for testing only
 */
export async function getPendingOrdersForDebug() {
  try {
    // Get the client (admin if available, regular if not)
    const supabaseAdmin = getSupabaseClient();

    // Fetch pending orders
    const { data, error, count } = await supabaseAdmin
      .from('orders')
      .select('id, status, created_at, total_amount, display_id', {
        count: 'exact',
      })
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching pending orders:', error);
      return {
        success: false,
        error: `${error.message}${error.hint ? ` - ${error.hint}` : ''}`,
        orders: [],
        count: 0
      };
    }

    return {
      success: true,
      orders: data || [],
      count: count || 0
    };
  } catch (error) {
    console.error('Failed to fetch pending orders:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      orders: [],
      count: 0
    };
  }
}

/**
 * Simple diagnostic function to check if environment variables are loaded
 * This is useful for debugging environment variable issues
 */
export async function checkSupabaseEnvVars() {
  // Try to get a client to test if we can connect
  let clientWorks = false;
  try {
    const client = getSupabaseClient();
    const { error } = await client.from('profiles').select('count').limit(1);
    clientWorks = !error;
  } catch (e) {
    clientWorks = false;
  }

  return {
    success: true,
    clientWorks,
    hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    urlPrefix: process.env.NEXT_PUBLIC_SUPABASE_URL ? process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 8) + '...' : 'not set',
    anonKeyPrefix: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 5) + '...' : 'not set',
    serviceKeyPrefix: process.env.SUPABASE_SERVICE_ROLE_KEY ? process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 5) + '...' : 'not set'
  };
}
