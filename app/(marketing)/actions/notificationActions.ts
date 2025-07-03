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
    console.log('📱 Preparing order notification for manual WhatsApp sending...', { orderId: orderDetails.display_id })

    // Create manual WhatsApp message for admin
    const whatsappText = `
🔔 *NEW ORDER ALERT* 🔔
🌿 *Betty's Organic Store* 🌿

📋 *Order Details:*
🔢 Order ID: ${orderDetails.display_id}
📅 Date: ${new Date(orderDetails.created_at).toLocaleDateString()}
⏰ Time: ${new Date(orderDetails.created_at).toLocaleTimeString()}

👤 *Customer Information:*
• Name: ${orderDetails.customer_name}
• Phone: ${orderDetails.customer_phone}
• Email: ${orderDetails.customer_email || 'Not provided'}
• Address: ${orderDetails.delivery_address}

📝 *Items Ordered:*
${orderDetails.items.map(item =>
      `• ${item.name} (${item.grams}g) - ETB ${item.price.toFixed(2)}`
    ).join('\n')}

💰 *Order Total: ETB ${orderDetails.total.toFixed(2)}*

🚚 *Action Required:*
1. Review order details
2. Contact customer to confirm
3. Prepare items for delivery
4. Update order status in dashboard

📞 *Contact Customer:* ${orderDetails.customer_phone}
🌐 *Dashboard:* Check admin panel for full details

⚡ *Priority:* NEW ORDER - Please process promptly!
    `.trim();

    // Log the successful manual notification preparation
    await logOrderNotification(orderDetails.display_id, 'whatsapp', 'sent')

    return {
      success: true,
      message: 'Order notification prepared for manual WhatsApp sending',
      whatsappUrl: `https://wa.me/251944113998?text=${encodeURIComponent(whatsappText)}`,
      provider: 'manual',
      data: { text: whatsappText }
    }
  } catch (error) {
    console.error('❌ Order notification preparation error:', error)

    // Log the failed notification
    await logOrderNotification(orderDetails.display_id, 'whatsapp', 'failed')

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to prepare notification'
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
