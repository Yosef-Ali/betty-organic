'use server';

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

/**
 * Tests Supabase connection directly with provided credentials
 * This is useful for debugging API key issues
 */
export async function testSupabaseConnection(url: string, key: string) {
  try {
    // Create a direct client with the provided credentials
    const supabase = createClient<Database>(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Try a simple query to test the connection
    const { data, error, status } = await supabase
      .from('orders')
      .select('count(*)', { count: 'exact', head: true });

    if (error) {
      console.error('Error testing Supabase connection:', error);
      return {
        success: false,
        error: `${error.message}${error.hint ? ` - ${error.hint}` : ''}`,
        status
      };
    }

    return {
      success: true,
      message: 'Successfully connected to Supabase',
      status,
      count: data
    };
  } catch (error) {
    console.error('Exception during Supabase connection test:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Tests the admin client specifically without creating a new client
 * This helps diagnose if there's an issue with the admin client setup
 */
export async function testAdminConnection() {
  try {
    // Print environment variables for debugging (never do this in production)
    const urlStart = process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 10) + '...';
    const keyStart = process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 5) + '...';

    console.log(`[DEBUG] Testing admin connection with URL: ${urlStart} and key: ${keyStart}`);

    // Create a direct client to test the connection
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Try a query that requires admin privileges
    const { data, error } = await supabase.from('profiles').select('count(*)', { count: 'exact', head: true });

    if (error) {
      return {
        success: false,
        error: `${error.message}${error.hint ? ` - ${error.hint}` : ''}`,
        envVarsPresent: {
          url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          key: !!process.env.SUPABASE_SERVICE_ROLE_KEY
        }
      };
    }

    return {
      success: true,
      message: 'Admin connection working correctly',
      count: data,
      envVarsPresent: {
        url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        key: !!process.env.SUPABASE_SERVICE_ROLE_KEY
      }
    };
  } catch (error) {
    console.error('Exception during admin connection test:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      envVarsPresent: {
        url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        key: !!process.env.SUPABASE_SERVICE_ROLE_KEY
      }
    };
  }
}
