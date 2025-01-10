'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface Order {
  id: string
  products: string[]
  status: 'pending' | 'processing' | 'completed' | 'cancelled'
  created_by: string
  created_at: string
}

export async function createOrder(order: Omit<Order, 'id' | 'created_at'>) {
  const supabase = await createServerSupabaseClient()
  try {
    const { data, error } = await supabase
      .from('orders')
      .insert({
        ...order,
        status: 'pending'
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath('/dashboard/orders')
    return data
  } catch (error) {
    console.error('Error creating order:', error)
    throw new Error('Failed to create order')
  }
}

export async function getOrders() {
  const supabase = await createServerSupabaseClient()
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as Order[]
  } catch (error) {
    console.error('Error fetching orders:', error)
    throw new Error('Failed to fetch orders')
  }
}
