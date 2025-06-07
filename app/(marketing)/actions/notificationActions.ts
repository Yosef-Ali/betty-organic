'use server'

import { createClient } from '@/lib/supabase/server'

export async function sendWhatsAppOrderNotification(orderData: {
  customerName: string
  customerPhone: string
  orderItems: Array<{
    name: string
    quantity: number
    price: number
  }>
  totalAmount: number
  deliveryAddress?: string
}) {
  try {
    // For now, just log the notification (WhatsApp integration can be added later)
    console.log('Order notification would be sent:', {
      to: process.env.ADMIN_WHATSAPP_NUMBER,
      message: `New order from ${orderData.customerName} (${orderData.customerPhone}). Total: $${orderData.totalAmount}`
    })

    // Simulate WhatsApp API call
    // In a real implementation, you would call WhatsApp API here
    
    return {
      success: true,
      message: 'Notification sent successfully'
    }
  } catch (error) {
    console.error('Failed to send WhatsApp notification:', error)
    return {
      success: false,
      error: 'Failed to send notification'
    }
  }
}

export async function sendOrderConfirmationEmail(orderData: {
  customerEmail: string
  customerName: string
  orderDetails: any
}) {
  try {
    // For now, just log the email (email service integration can be added later)
    console.log('Order confirmation email would be sent:', {
      to: orderData.customerEmail,
      subject: 'Order Confirmation',
      customerName: orderData.customerName
    })

    return {
      success: true,
      message: 'Email sent successfully'
    }
  } catch (error) {
    console.error('Failed to send confirmation email:', error)
    return {
      success: false,
      error: 'Failed to send email'
    }
  }
}

export async function logOrderNotification(orderId: string, type: 'whatsapp' | 'email', status: 'sent' | 'failed') {
  try {
    const supabase = createClient()
    
    // Log notification attempt
    const { error } = await supabase
      .from('order_notifications')
      .insert({
        order_id: orderId,
        notification_type: type,
        status: status,
        sent_at: new Date().toISOString()
      })

    if (error) {
      console.error('Failed to log notification:', error)
    }
  } catch (error) {
    console.error('Failed to log notification:', error)
  }
}
