'use server'

import { sendWhatsAppMessage } from './whatsapp-api-service'

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
        // Enhanced debugging logs
        console.log('🔍 [VERCEL-NOTIFICATION] Starting automatic order notification...', {
            orderId: orderData.display_id,
            timestamp: new Date().toISOString(),
            customer: orderData.customer_name,
            itemCount: orderData.items.length
        });

        // Get admin phone number from environment variable
        const adminPhoneNumber = process.env.ADMIN_WHATSAPP_NUMBER || '+251944113998'

        console.log('📞 [VERCEL-NOTIFICATION] Target admin phone:', adminPhoneNumber);

        // Format order items for display
        const itemsList = orderData.items
            .map(item => `• ${item.product_name} (Qty: ${item.quantity}) - ETB ${item.price.toFixed(2)}`)
            .join('\n')

        // Calculate net total
        const netTotal = orderData.total_amount + (orderData.delivery_cost || 0) - (orderData.discount_amount || 0)

        console.log('💰 [VERCEL-NOTIFICATION] Financial summary:', {
            subtotal: orderData.total_amount,
            delivery: orderData.delivery_cost || 0,
            discount: orderData.discount_amount || 0,
            total: netTotal
        });

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

        console.log('📱 [VERCEL-NOTIFICATION] Sending automatic WhatsApp order notification:', {
            orderId: orderData.display_id,
            customer: orderData.customer_name,
            total: netTotal,
            itemCount: orderData.items.length,
            to: adminPhoneNumber,
            messageLength: message.length
        })

        // Send via Vercel-compatible WhatsApp API service
        console.log('🚀 [VERCEL-NOTIFICATION] Using WhatsApp API service (Vercel-compatible)...')
        const result = await sendWhatsAppMessage(adminPhoneNumber, message)

        if (result.success) {
            console.log('✅ [VERCEL-NOTIFICATION] Automatic order notification sent successfully!', {
                orderId: orderData.display_id,
                messageId: result.messageId,
                provider: result.provider,
                method: 'whatsapp_api',
                timestamp: new Date().toISOString()
            })

            return {
                success: true,
                message: `Order notification sent successfully via ${result.provider}!`,
                messageId: result.messageId,
                method: 'whatsapp_api',
                provider: result.provider,
                orderData: {
                    orderId: orderData.display_id,
                    customer: orderData.customer_name,
                    total: netTotal
                }
            }
        } else {
            console.warn('⚠️ [VERCEL-NOTIFICATION] WhatsApp API sending failed:', result.error)

            // Log the failure but don't break the order flow
            return {
                success: false,
                message: 'WhatsApp notification failed - continuing without notification',
                method: 'api_failed',
                error: `WhatsApp API failed: ${result.error}`,
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

        // Send via Vercel-compatible WhatsApp API service
        console.log('🔧 [VERCEL-NOTIFICATION] Attempting status update via WhatsApp API...')
        const result = await sendWhatsAppMessage(adminPhoneNumber, message)

        if (result.success) {
            console.log('✅ [VERCEL-NOTIFICATION] Status update notification sent successfully!')
            return {
                success: true,
                message: `Status update notification sent successfully via ${result.provider}!`,
                messageId: result.messageId,
                method: 'whatsapp_api',
                provider: result.provider
            }
        } else {
            console.warn('⚠️ [VERCEL-NOTIFICATION] Status update failed, continuing without notification:', result.error)

            return {
                success: false,
                message: 'Status update notification failed - continuing without notification',
                method: 'api_failed',
                error: `WhatsApp API failed: ${result.error}`
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

        // Send order notification first via API
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

        console.log('✅ Order notification sent via API, invoice sending not yet implemented for API mode...')

        // Note: Invoice functionality would need to be adapted for API providers
        // This could involve generating invoice images and sending via media endpoints

        return {
            success: true,
            message: 'Order notification sent successfully! Invoice feature coming soon for API mode.',
            notificationMessageId: notificationResult.messageId,
            notificationSent: true,
            invoiceSent: false,
            invoiceNote: 'Invoice sending via API providers is under development'
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
