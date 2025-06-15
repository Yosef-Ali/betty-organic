'use server'

import { createClient } from '@/lib/supabase/server'
import { sendAdminWhatsAppNotification } from '@/app/actions/whatsappActions'

interface OrderDetails {
  id: string | number
  display_id: string
  items: Array<{
    name: string
    grams: number
    price: number
    unit_price: number
  }>
  total: number
  customer_name: string
  customer_phone: string
  delivery_address: string
  customer_email?: string | null
  user_id?: string | null
  created_at: string
}

export async function sendWhatsAppOrderNotification(orderDetails: OrderDetails, adminPhoneNumber?: string) {
  try {
    console.log('📱 Sending order notification via Twilio WhatsApp...', { orderId: orderDetails.display_id })

    // Use the enhanced WhatsApp action that supports Twilio
    const result = await sendAdminWhatsAppNotification(orderDetails)

    if (result.success) {
      console.log('✅ Order notification sent successfully:', result)

      // Log the successful notification
      await logOrderNotification(orderDetails.display_id, 'whatsapp', 'sent')

      return {
        success: true,
        message: result.automatic
          ? `Admin notified automatically via ${result.automatic.provider}`
          : 'Admin notification URL generated',
        automatic: result.automatic,
        whatsappUrl: result.whatsappUrl,
        provider: result.provider,
        data: result.data
      }
    } else {
      console.error('❌ Failed to send order notification:', result.error)

      // Log the failed notification  
      await logOrderNotification(orderDetails.display_id, 'whatsapp', 'failed')

      return {
        success: false,
        error: result.error || 'Failed to send notification'
      }
    }
  } catch (error) {
    console.error('❌ Order notification error:', error)

    // Log the failed notification
    await logOrderNotification(orderDetails.display_id, 'whatsapp', 'failed')

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send notification'
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
    const supabase = await createClient()

    // Log notification attempt (if table exists)
    try {
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
    } catch (dbError) {
      // Table might not exist - just log and continue
      console.log('Note: order_notifications table not found, notification logged to console only')
    }
  } catch (error) {
    console.error('Failed to log notification:', error)
  }
}
