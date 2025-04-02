'use server';

import { createClient as createServerClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

/**
 * Server action to safely refresh the authentication token
 * This avoids the client-side cookie manipulation errors
 */
export async function refreshAuthToken() {
  try {
    const supabase = await createServerClient();
    const { data, error } = await supabase.auth.refreshSession();

    if (error) {
      console.error('Error refreshing token:', error);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      session: data.session,
      user: data.user
    };
  } catch (error) {
    console.error('Unexpected error in refreshAuthToken:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    };
  }
}
