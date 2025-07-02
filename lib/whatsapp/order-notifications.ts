'use server'

import { sendBaileysMessage } from './baileys-service'
import { sendImageInvoiceWhatsApp } from './invoices'

export interface OrderNotificationData {
    id: string
    display_id: string
    customer_name: string
    customer_phone: string
    customer_email?: string
    delivery_address?: string
    items: Array<{
        product_name: string
        quantity: number
        price: number
    }>
    total_amount: number
    delivery_cost?: number
    discount_amount?: number
    created_at: string
    status: string
    type: string
}

export async function sendOrderNotificationWhatsApp(orderData: OrderNotificationData) {
    try {
        // Get admin phone number from localStorage settings or environment variable
        const adminPhoneNumber = process.env.ADMIN_WHATSAPP_NUMBER || '+251944113998'

        // Format order items for display
        const itemsList = orderData.items
            .map(item => `• ${item.product_name} (Qty: ${item.quantity}) - ETB ${item.price.toFixed(2)}`)
            .join('\n')

        // Calculate net total
        const netTotal = orderData.total_amount + (orderData.delivery_cost || 0) - (orderData.discount_amount || 0)

        // Create comprehensive order notification message
        const message = `🍎 *NEW ORDER - Betty Organic*

*Order Details:*
━━━━━━━━━━━━━━━━━━━━
📋 *Order ID:* ${orderData.display_id}
👤 *Customer:* ${orderData.customer_name}
📱 *Phone:* ${orderData.customer_phone}
${orderData.customer_email ? `📧 *Email:* ${orderData.customer_email}\n` : ''}${orderData.delivery_address ? `🏠 *Address:* ${orderData.delivery_address}\n` : ''}
*Products Ordered:*
${itemsList}

*Financial Summary:*
━━━━━━━━━━━━━━━━━━━━
💰 *Subtotal:* ETB ${orderData.total_amount.toFixed(2)}
${orderData.delivery_cost ? `🚚 *Delivery:* ETB ${orderData.delivery_cost.toFixed(2)}\n` : ''}${orderData.discount_amount ? `💸 *Discount:* -ETB ${orderData.discount_amount.toFixed(2)}\n` : ''}*Total Amount:* ETB ${netTotal.toFixed(2)}

*Order Info:*
━━━━━━━━━━━━━━━━━━━━
⏰ *Time:* ${new Date(orderData.created_at).toLocaleString('en-US', {
            timeZone: 'Africa/Addis_Ababa',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })}
🏷️ *Status:* ${orderData.status.toUpperCase()}
📦 *Type:* ${orderData.type === 'self_service' ? 'Customer Order' : 'Store Order'}

🚀 *Action Required:* Please process this order immediately!

💚 *Betty Organic - Fresh & Healthy*`

        console.log('📱 Sending WhatsApp order notification:', {
            orderId: orderData.display_id,
            customer: orderData.customer_name,
            total: netTotal,
            itemCount: orderData.items.length
        })

        // In production, use manual URLs for reliability due to serverless limitations
        const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1'
        
        if (isProduction) {
            console.log('🌐 Production mode: Using manual WhatsApp URL for reliability')
            const cleanPhone = adminPhoneNumber.replace(/[\s\-\(\)\+]/g, '')
            const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
            
            console.log('✅ Order notification manual URL generated:', {
                orderId: orderData.display_id,
                url: whatsappUrl.substring(0, 100) + '...'
            })
            
            return {
                success: true,
                message: 'Order notification ready to send via WhatsApp URL',
                whatsappUrl,
                method: 'manual_url_production',
                orderData: {
                    orderId: orderData.display_id,
                    customer: orderData.customer_name,
                    total: netTotal
                }
            }
        }
        
        // Development mode: try automated sending via Baileys
        console.log('🔧 Development mode: Attempting automated WhatsApp sending')
        const result = await sendBaileysMessage({
            to: adminPhoneNumber,
            message: message
        })

        if (result.success) {
            console.log('✅ Order notification sent successfully via WhatsApp:', {
                orderId: orderData.display_id,
                messageId: result.messageId
            })

            return {
                success: true,
                message: 'Order notification sent successfully!',
                messageId: result.messageId,
                orderData: {
                    orderId: orderData.display_id,
                    customer: orderData.customer_name,
                    total: netTotal
                }
            }
        } else {
            console.error('❌ Failed to send order notification, falling back to manual URL:', result.error)
            
            // Fallback to manual URL even in development
            const cleanPhone = adminPhoneNumber.replace(/[\s\-\(\)\+]/g, '')
            const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
            
            return {
                success: true,
                message: 'Order notification fallback URL generated',
                whatsappUrl,
                method: 'manual_url_fallback',
                error: `Baileys failed: ${result.error}`,
                orderData: {
                    orderId: orderData.display_id,
                    customer: orderData.customer_name,
                    total: netTotal
                }
            }
        }
    } catch (error) {
        console.error('💥 Error in sendOrderNotificationWhatsApp:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        }
    }
}

export async function sendOrderStatusUpdateWhatsApp(orderData: OrderNotificationData, oldStatus: string, newStatus: string) {
    try {
        // For customer notifications, we'd send to customer phone
        // For now, let's send status updates to admin
        const adminPhoneNumber = process.env.ADMIN_WHATSAPP_NUMBER || '+251944113998'

        const statusEmojis: Record<string, string> = {
            'pending': '⏳',
            'confirmed': '✅',
            'processing': '👨‍🍳',
            'ready': '📦',
            'delivering': '🚚',
            'delivered': '🎉',
            'completed': '💚',
            'cancelled': '❌'
        }

        const message = `📋 *ORDER STATUS UPDATE*

*Order ID:* ${orderData.display_id}
*Customer:* ${orderData.customer_name}

*Status Changed:*
${statusEmojis[oldStatus] || '⚪'} ${oldStatus.toUpperCase()} → ${statusEmojis[newStatus] || '⚪'} ${newStatus.toUpperCase()}

*Updated:* ${new Date().toLocaleString('en-US', {
            timeZone: 'Africa/Addis_Ababa',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })}

💚 *Betty Organic*`

        // In production, use manual URLs for reliability 
        const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1'
        
        if (isProduction) {
            console.log('🌐 Production mode: Using manual WhatsApp URL for status update')
            const cleanPhone = adminPhoneNumber.replace(/[\s\-\(\)\+]/g, '')
            const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
            
            return {
                success: true,
                message: 'Status update notification ready to send via WhatsApp URL',
                whatsappUrl,
                method: 'manual_url_production'
            }
        }

        // Development mode: try automated sending
        const result = await sendBaileysMessage({
            to: adminPhoneNumber,
            message: message
        })

        if (result.success) {
            console.log('✅ Status update notification sent successfully')
            return {
                success: true,
                message: 'Status update notification sent!',
                messageId: result.messageId
            }
        } else {
            console.error('❌ Failed to send status update notification, falling back to manual URL:', result.error)
            
            // Fallback to manual URL
            const cleanPhone = adminPhoneNumber.replace(/[\s\-\(\)\+]/g, '')
            const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
            
            return {
                success: true,
                message: 'Status update fallback URL generated',
                whatsappUrl,
                method: 'manual_url_fallback',
                error: `Baileys failed: ${result.error}`
            }
        }
    } catch (error) {
        console.error('💥 Error in sendOrderStatusUpdateWhatsApp:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        }
    }
}

export async function sendOrderNotificationWithInvoice(orderData: OrderNotificationData) {
    try {
        console.log('📋 Sending complete order notification with invoice for order:', orderData.display_id)

        // Send order notification first
        const notificationResult = await sendOrderNotificationWhatsApp(orderData)

        if (!notificationResult.success) {
            console.error('❌ Order notification failed, skipping invoice:', notificationResult.error)
            return {
                success: false,
                error: `Order notification failed: ${notificationResult.error}`,
                notificationSent: false,
                invoiceSent: false
            }
        }

        console.log('✅ Order notification sent, now sending invoice...')

        // Prepare invoice data from order data
        const invoiceData = {
            customerPhone: orderData.customer_phone,
            customerName: orderData.customer_name,
            orderId: orderData.display_id,
            items: orderData.items.map(item => ({
                name: item.product_name,
                quantity: item.quantity,
                price: item.price
            })),
            total: orderData.total_amount + (orderData.delivery_cost || 0) - (orderData.discount_amount || 0),
            orderDate: new Date(orderData.created_at).toLocaleDateString(),
            orderTime: new Date(orderData.created_at).toLocaleTimeString(),
            storeName: 'Betty Organic',
            storeContact: process.env.ADMIN_WHATSAPP_NUMBER || '+251944113998'
        }

        // Send invoice
        const invoiceResult = await sendImageInvoiceWhatsApp(invoiceData)

        if (invoiceResult.success) {
            console.log('✅ Complete order notification with invoice sent successfully!')
            return {
                success: true,
                message: 'Order notification and invoice sent successfully!',
                notificationMessageId: notificationResult.messageId,
                invoiceMessageId: invoiceResult.messageId,
                notificationSent: true,
                invoiceSent: true,
                invoiceMethod: invoiceResult.method
            }
        } else {
            console.warn('⚠️ Invoice sending failed, but notification was sent:', invoiceResult.error)
            return {
                success: true, // Still success because notification was sent
                message: 'Order notification sent, but invoice failed to send',
                notificationMessageId: notificationResult.messageId,
                notificationSent: true,
                invoiceSent: false,
                invoiceError: invoiceResult.error
            }
        }

    } catch (error) {
        console.error('💥 Error in sendOrderNotificationWithInvoice:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred',
            notificationSent: false,
            invoiceSent: false
        }
    }
}
