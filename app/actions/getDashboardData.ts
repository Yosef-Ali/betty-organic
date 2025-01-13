import { supabase } from '@/lib/supabase/client'

export async function getDashboardData() {
  return {
    totalRevenue: 0,
    subscriptions: 0,
    sales: 0,
    activeNow: 0,
  };
}
