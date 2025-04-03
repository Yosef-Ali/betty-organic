'use server';

import { createClient } from '@/lib/supabase/server';

/**
 * A simpler approach to apply the test order policy
 * This directly creates the policy without requiring admin privileges
 */
export async function applyDirectTestOrderPolicy() {
  try {
    const supabase = await createClient();
    
    // Get current user to verify authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return {
        success: false,
        error: 'Authentication required to apply policy'
      };
    }
    
    // Apply the policy directly with SQL
    const { error } = await supabase.rpc('create_test_order_policy');
    
    if (error) {
      console.error('Error applying test order policy:', error);
      return {
        success: false,
        error: `Failed to apply test order policy: ${error.message}`
      };
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
