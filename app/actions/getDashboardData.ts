import { supabase } from '@/lib/supabase';

export async function getDashboardData() {
  // Calculate total revenue from orders
  const { data: totalRevenueResult, error: totalRevenueError } = await supabase
    .from('orders')
    .select('total_amount', { count: 'exact' });

  if (totalRevenueError) {
    throw new Error('Failed to calculate total revenue');
  }

  const totalRevenue = totalRevenueResult.reduce((sum, order) => sum + order.total_amount, 0);

  // Count total number of subscriptions (customers)
  const { count: subscriptions, error: subscriptionsError } = await supabase
    .from('customers')
    .select('*', { count: 'exact' });

  if (subscriptionsError) {
    throw new Error('Failed to count subscriptions');
  }

  // Count total number of sales (orders)
  const { count: sales, error: salesError } = await supabase
    .from('orders')
    .select('*', { count: 'exact' });

  if (salesError) {
    throw new Error('Failed to count sales');
  }

  // Define the time frame (customers who have placed an order in the last hour)
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  // Count number of active customers based on recent orders
  const { count: activeNow, error: activeNowError } = await supabase
    .from('customers')
    .select('*', { count: 'exact' })
    .gte('orders.created_at', oneHourAgo.toISOString());

  if (activeNowError) {
    throw new Error('Failed to count active customers');
  }

  return {
    totalRevenue,
    subscriptions,
    sales,
    activeNow,
  };
}
