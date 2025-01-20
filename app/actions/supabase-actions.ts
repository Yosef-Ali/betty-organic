'use server'

import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

// Use server-side environment variables for server actions
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

// Create Supabase client with server-side configuration
const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
})

export async function getRecentOrders(limit = 5) {
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
