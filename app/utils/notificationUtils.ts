import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';

/**
 * Helper function to get client-side Supabase instance
 * This is used for realtime subscriptions which must be client-side
 */
export function getClientSupabase() {
  return createClientComponentClient<Database>();
}

/**
 * Helper function to determine if an order is pending
 * @param status Order status string
 * @returns boolean indicating if the order is pending
 */
export function isOrderPending(status: string | null | undefined): boolean {
  if (!status || typeof status !== 'string') return false;
  
  const statusLower = status.toLowerCase();
  return (
    statusLower === 'pending' ||
    statusLower.includes('pending') ||
    statusLower === 'new' ||
    statusLower === 'processing'
  );
}
