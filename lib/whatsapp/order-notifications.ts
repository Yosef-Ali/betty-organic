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
        // Enhanced debugging logs
        console.log('🔍 [AUTO-NOTIFICATION] Starting automatic order notification...', {
            orderId: orderData.display_id,
            timestamp: new Date().toISOString(),
            customer: orderData.customer_name,
            itemCount: orderData.items.length
        });

        // Get admin phone number from localStorage settings or environment variable
        const adminPhoneNumber = process.env.ADMIN_WHATSAPP_NUMBER || '+251944113998'

        console.log('📞 [AUTO-NOTIFICATION] Target admin phone:', adminPhoneNumber);

        // Format order items for display
        const itemsList = orderData.items
            .map(item => `• ${item.product_name} (Qty: ${item.quantity}) - ETB ${item.price.toFixed(2)}`)
            .join('\n')

        // Calculate net total
        const netTotal = orderData.total_amount + (orderData.delivery_cost || 0) - (orderData.discount_amount || 0)

        console.log('💰 [AUTO-NOTIFICATION] Financial summary:', {
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

        console.log('📱 [AUTO-WHATSAPP] Sending automatic WhatsApp order notification:', {
            orderId: orderData.display_id,
            customer: orderData.customer_name,
            total: netTotal,
            itemCount: orderData.items.length,
            to: adminPhoneNumber,
            messageLength: message.length
        })

        // Enhanced Baileys connection check
        console.log('🔧 [AUTO-WHATSAPP] Attempting automated WhatsApp sending via Baileys...')
        console.log('🔍 [AUTO-WHATSAPP] Checking Baileys service availability...')

        // Import and check Baileys status first
        const { getBaileysStatus } = await import('./baileys-service')
        const status = getBaileysStatus()

        console.log('� [AUTO-WHATSAPP] Baileys status check:', {
            isConnected: status.isConnected,
            isConnecting: status.isConnecting,
            hasClient: status.hasClient,
            canRetry: status.canRetry,
            attempts: status.attempts
        })

        if (!status.isConnected && !status.isConnecting) {
            console.warn('⚠️ [AUTO-WHATSAPP] Baileys not connected - attempting auto-connection...')

            const { initializeBaileys } = await import('./baileys-service')
            const initResult = await initializeBaileys({
                sessionPath: './baileys-session',
                phoneNumber: adminPhoneNumber
            })

            console.log('🔄 [AUTO-WHATSAPP] Auto-connection result:', initResult)

            if (!initResult.success) {
                console.error('❌ [AUTO-WHATSAPP] Auto-connection failed:', initResult.error)
                return {
                    success: false,
                    message: 'WhatsApp not connected - please connect via admin panel',
                    method: 'connection_failed',
                    error: `Baileys connection failed: ${initResult.error}`,
                    orderData: {
                        orderId: orderData.display_id,
                        customer: orderData.customer_name,
                        total: netTotal
                    }
                }
            }
        }

        const result = await sendBaileysMessage({
            to: adminPhoneNumber,
            message: message
        })

        if (result.success) {
            console.log('✅ [AUTO-WHATSAPP] Automatic order notification sent successfully!', {
                orderId: orderData.display_id,
                messageId: result.messageId,
                method: 'automated_baileys',
                timestamp: new Date().toISOString()
            })

            return {
                success: true,
                message: 'Order notification sent automatically!',
                messageId: result.messageId,
                method: 'automated_baileys',
                orderData: {
                    orderId: orderData.display_id,
                    customer: orderData.customer_name,
                    total: netTotal
                }
            }
        } else {
            console.warn('⚠️ [AUTO-WHATSAPP] Automatic sending failed, continuing without notification:', result.error)

            // Do NOT involve customer - just log the failure and continue
            return {
                success: false,
                message: 'WhatsApp notification failed - continuing without notification',
                method: 'automatic_failed',
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

        // Always use automated sending for status updates
        console.log('🔧 [AUTO-WHATSAPP] Attempting automated status update via Baileys...')
        const result = await sendBaileysMessage({
            to: adminPhoneNumber,
            message: message
        })

        if (result.success) {
            console.log('✅ [AUTO-WHATSAPP] Status update notification sent successfully!')
            return {
                success: true,
                message: 'Status update notification sent automatically!',
                messageId: result.messageId,
                method: 'automated_baileys'
            }
        } else {
            console.warn('⚠️ [AUTO-WHATSAPP] Status update failed, continuing without notification:', result.error)

            // Do NOT involve customer - just log the failure and continue
            return {
                success: false,
                message: 'Status update notification failed - continuing without notification',
                method: 'automatic_failed',
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
