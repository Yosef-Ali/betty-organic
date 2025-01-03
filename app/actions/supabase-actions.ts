'use server'

import { Database } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'
//import { Database } from '@/types/supabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

export async function getRecentOrders(limit = 5) {
  const { data, error } = await supabase
    .from('orders')
    .select('*, customers!orders_customer_id_fkey(full_name)')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching recent orders:', error)
    return []
  }

  return data
}

export async function getRecentSales(limit = 5) {
  const { data, error } = await supabase
    .from('orders')
    .select('*, customers!orders_customer_id_fkey(full_name, email)')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching recent sales:', error)
    return []
  }

  return data
}

export async function getTotalRevenue() {
  const { data, error } = await supabase
    .from('orders')
    .select('total_amount')

  if (error) {
    console.error('Error fetching total revenue:', error)
    return 0
  }

  return data.reduce((sum, order) => sum + order.total_amount, 0)
}

export async function getTotalCustomers() {
  const { count, error } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true })

  if (error) {
    console.error('Error fetching total customers:', error)
    return 0
  }

  return count
}

export async function getTotalProducts() {
  const { count, error } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })

  if (error) {
    console.error('Error fetching total products:', error)
    return 0
  }

  return count
}

export async function getTotalOrders() {
  const { count, error } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })

  if (error) {
    console.error('Error fetching total orders:', error)
    return 0
  }

  return count
}

