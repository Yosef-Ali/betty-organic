'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

import { Order } from "@/types/order"

interface OrderItem {
  product_id: string
  quantity: number
  price: number
  name: string
}

export async function createOrder(orderData: Order) {
  const supabase = await createServerSupabaseClient()
  try {
    // First, create the order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_id: orderData.customerId,
        status: orderData.status,
        type: orderData.type,
        total_amount: orderData.totalAmount,
        customer_info: orderData.customerInfo,
        order_number: orderData.orderNumber
      })
      .select()
      .single()

    if (orderError) throw orderError

    // Then, create the order items
    const orderItems = orderData.items.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.price,
      product_name: item.name
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (itemsError) throw itemsError

    revalidatePath('/dashboard/orders')
    return order
  } catch (error) {
    console.error('Error creating order:', error)
    throw error
  }
}

export async function getOrders() {
  const supabase = await createServerSupabaseClient()
  try {
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          product_id,
          quantity,
          price,
          product_name
        )
      `)
      .order('created_at', { ascending: false })

    if (ordersError) throw ordersError
    return orders
  } catch (error) {
    console.error('Error fetching orders:', error)
    throw error
  }
}
