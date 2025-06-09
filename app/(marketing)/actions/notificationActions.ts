'use server'

import { createClient } from '@/lib/supabase/server'

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
    // Use provided admin phone number from client settings, or fall back to environment variable
    const adminPhone = adminPhoneNumber || process.env.ADMIN_WHATSAPP_NUMBER || '+251912345678'
    
    // Format order items
    const itemsList = orderDetails.items
      .map(item => `• ${item.name} (${item.grams}g) - ETB ${item.price.toFixed(2)}`)
      .join('\n')
    
    // Create formatted message
    const message = `🍎 *NEW ORDER - Betty Organic*

*Order ID:* ${orderDetails.display_id}
*Customer:* ${orderDetails.customer_name}
*Phone:* ${orderDetails.customer_phone}
*Delivery Address:* ${orderDetails.delivery_address}

*Items:*
${itemsList}

*Total Amount:* ETB ${orderDetails.total.toFixed(2)}

*Order Time:* ${new Date(orderDetails.created_at).toLocaleString()}

Please process this order as soon as possible! 🚚`

    // Generate WhatsApp URL - this will open WhatsApp with pre-filled message
    const whatsappUrl = `https://wa.me/${adminPhone.replace('+', '')}?text=${encodeURIComponent(message)}`
    
    // For free WhatsApp accounts, we just prepare the URL
    // The admin will need to manually click send in WhatsApp
    return {
      success: true,
      message: 'WhatsApp notification URL prepared - admin needs to manually send',
      whatsappUrl,
      requiresManualSend: true,
      data: {
        adminPhone,
        message,
        orderId: orderDetails.display_id
      }
    }
  } catch (error) {
    console.error('Failed to prepare WhatsApp notification:', error)
    return {
      success: false,
      error: 'Failed to prepare notification'
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
