'use server';

import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * Applies the test order policy to the database
 * This should be run once to enable test orders
 */
export async function applyTestOrderPolicy() {
  try {
    // First try with the regular client
    const supabase = await createClient();

    // Get current user to verify authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        success: false,
        error: 'Authentication required to apply policy'
      };
    }

    // Check if the user has the admin role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      return {
        success: false,
        error: `Failed to verify user role: ${profileError.message}`
      };
    }

    // Try to apply the policy directly with SQL
    // This approach uses a direct SQL query which is more reliable than RPC
    const { error } = await supabase.from('_test_orders_policy').insert({
      type: 'test',
      profile_id: user.id,
      customer_profile_id: user.id,
      total_amount: 0.01,
      status: 'test'
    });

    // If the insert worked, the policy is already in place
    if (!error) {
      return {
        success: true,
        message: 'Test order policy is already applied'
      };
    }

    // If we get here, we need to apply the policy
    // This requires admin privileges
    if (profile?.role !== 'admin') {
      return {
        success: false,
        error: 'Admin privileges required to apply policy'
      };
    }

    // Use the admin client to apply the policy
    // This requires the SUPABASE_SERVICE_ROLE_KEY environment variable to be set
    const { error: policyError } = await supabaseAdmin.rpc('apply_test_order_policy', {});

    if (policyError) {
      // If RPC fails, try direct SQL approach
      const { error: sqlError } = await supabaseAdmin.from('_test_orders_policy_apply').insert({
        applied_by: user.id
      });

      if (sqlError) {
        console.error('Error applying test order policy:', sqlError);
        return {
          success: false,
          error: `Failed to apply test order policy: ${sqlError.message}`
        };
      }
    }

    return {
      success: true,
      message: 'Test order policy applied successfully'
    };
  } catch (error) {
    console.error('Failed to apply test order policy:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
