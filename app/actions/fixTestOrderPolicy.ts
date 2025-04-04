'use server';

import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

/**
 * A simplified approach to apply the test order policy
 * This uses a direct SQL approach without relying on RPC or admin client
 */
export async function fixTestOrderPolicy() {
  try {
    // Use the server client for authentication
    const supabase = await createClient();
    
    // Get current user to verify authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return {
        success: false,
        error: 'Authentication required to apply policy'
      };
    }
    
    // Create a direct client for the SQL operation
    // This avoids issues with the admin client in server actions
    const directClient = createSupabaseClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    // Try to create a test order directly
    // If this succeeds, the policy is working
    const { data: testData, error: testError } = await directClient
      .from('orders')
      .insert({
        profile_id: user.id,
        customer_profile_id: user.id,
        total_amount: 0.01,
        status: 'pending',
        type: 'test',
        display_id: `TEST-POLICY-${Date.now().toString().slice(-6)}`,
      })
      .select()
      .single();
    
    // If the test order was created successfully, the policy is working
    if (!testError && testData) {
      return {
        success: true,
        message: 'Test order policy is working correctly',
        orderId: testData.id
      };
    }
    
    // If we get here, we need to try a different approach
    // Create a special table entry that will trigger a database function to apply the policy
    const { error: policyError } = await directClient
      .from('_policy_requests')
      .insert({
        requested_by: user.id,
        policy_type: 'test_orders',
        status: 'pending'
      });
    
    if (policyError) {
      // If that fails, try one more approach - direct SQL via function
      const { error: functionError } = await directClient.rpc('enable_test_orders_for_user', {
        user_id: user.id
      });
      
      if (functionError) {
        return {
          success: false,
          error: `Failed to apply test order policy: ${functionError.message}`
        };
      }
    }
    
    return {
      success: true,
      message: 'Test order policy request submitted successfully'
    };
  } catch (error) {
    console.error('Failed to apply test order policy:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
