'use server'

import { createClient } from '@/lib/supabase/server'
import { Database } from '@/types/supabase'

export async function getSupabaseClient() {
  return await createClient<Database>()
}

export async function getRecentOrders(limit = 5) {
  const supabase = await getSupabaseClient();
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*, customers!orders_customer_id_fkey(full_name)')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error fetching recent orders:', error)
    return []
  }
}

export async function getRecentSales(limit = 5) {
  const supabase = await getSupabaseClient();
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*, customers!orders_customer_id_fkey(full_name, email)')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error fetching recent sales:', error)
    return []
  }
}

export async function getTotalRevenue() {
  const supabase = await getSupabaseClient();
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('total_amount')

    if (error) throw error
    return data.reduce((sum, order) => sum + order.total_amount, 0)
  } catch (error) {
    console.error('Error fetching total revenue:', error)
    return 0
  }
}

export async function getTotalCustomers() {
  const supabase = await getSupabaseClient();
  try {
    const { count, error } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })

    if (error) throw error
    return count ?? 0
  } catch (error) {
    console.error('Error fetching total customers:', error)
    return 0
  }
}

export async function getTotalProducts() {
  const supabase = await getSupabaseClient();
  try {
    const { count, error } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })

    if (error) throw error
    return count ?? 0
  } catch (error) {
    console.error('Error fetching total products:', error)
    return 0
  }
}

export async function getTotalOrders() {
  const supabase = await getSupabaseClient();
  try {
    const { count, error } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })

    if (error) throw error
    return count ?? 0
  } catch (error) {
    console.error('Error fetching total orders:', error)
    return 0
  }
}
