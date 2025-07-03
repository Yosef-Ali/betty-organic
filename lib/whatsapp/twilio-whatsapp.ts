'use server'

import twilio from 'twilio'

// Twilio WhatsApp Configuration
const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886' // Twilio Sandbox number

// Initialize Twilio client
const client = twilio(accountSid, authToken)

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
        console.log('📱 [TWILIO-WHATSAPP] Starting order notification via Twilio...', {
            orderId: orderData.display_id,
            customer: orderData.customer_name,
            timestamp: new Date().toISOString()
        })

        // Validate Twilio configuration
        if (!accountSid || !authToken) {
            console.error('❌ [TWILIO-WHATSAPP] Missing Twilio credentials')
            return {
                success: false,
                error: 'Twilio credentials not configured',
                method: 'twilio_config_error'
            }
        }

        // Get admin phone number from environment
        const adminPhoneNumber = process.env.ADMIN_WHATSAPP_NUMBER || '+251944113998'

        // Format admin phone for WhatsApp (must include whatsapp: prefix)
        const adminWhatsAppNumber = `whatsapp:${adminPhoneNumber}`

        console.log('📞 [TWILIO-WHATSAPP] Target admin phone:', adminWhatsAppNumber)

        // Format order items for display
        const itemsList = orderData.items
            .map(item => `• ${item.product_name} (Qty: ${item.quantity}) - ETB ${item.price.toFixed(2)}`)
            .join('\n')

        // Calculate net total
        const netTotal = orderData.total_amount + (orderData.delivery_cost || 0) - (orderData.discount_amount || 0)

        console.log('💰 [TWILIO-WHATSAPP] Financial summary:', {
            subtotal: orderData.total_amount,
            delivery: orderData.delivery_cost || 0,
            discount: orderData.discount_amount || 0,
            total: netTotal
        })

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

        console.log('📝 [TWILIO-WHATSAPP] Message prepared, length:', message.length)

        // Send WhatsApp message via Twilio
        console.log('🔧 [TWILIO-WHATSAPP] Sending via Twilio API...')

        const messageResponse = await client.messages.create({
            body: message,
            from: twilioWhatsAppNumber,
            to: adminWhatsAppNumber
        })

        console.log('✅ [TWILIO-WHATSAPP] Message sent successfully!', {
            messageSid: messageResponse.sid,
            status: messageResponse.status,
            orderId: orderData.display_id,
            timestamp: new Date().toISOString()
        })

        return {
            success: true,
            message: 'WhatsApp notification sent via Twilio!',
            messageId: messageResponse.sid,
            method: 'twilio_whatsapp',
            status: messageResponse.status,
            orderData: {
                orderId: orderData.display_id,
                customer: orderData.customer_name,
                total: netTotal
            }
        }

    } catch (error) {
        console.error('💥 [TWILIO-WHATSAPP] Error sending notification:', error)

        // Enhanced error handling for Twilio-specific errors
        let errorMessage = 'Unknown error occurred'

        if (error && typeof error === 'object' && 'code' in error) {
            const twilioError = error as any
            switch (twilioError.code) {
                case 21211:
                    errorMessage = 'Invalid WhatsApp number format'
                    break
                case 21214:
                    errorMessage = 'WhatsApp number not opted in to Twilio sandbox'
                    break
                case 21408:
                    errorMessage = 'Permission to send messages to unverified number'
                    break
                case 20003:
                    errorMessage = 'Invalid Twilio credentials'
                    break
                default:
                    errorMessage = `Twilio error ${twilioError.code}: ${twilioError.message}`
            }
        } else if (error instanceof Error) {
            errorMessage = error.message
        }

        return {
            success: false,
            error: errorMessage,
            method: 'twilio_whatsapp_failed',
            orderData: {
                orderId: orderData.display_id,
                customer: orderData.customer_name,
                total: orderData.total_amount + (orderData.delivery_cost || 0) - (orderData.discount_amount || 0)
            }
        }
    }
}

export async function sendOrderStatusUpdateWhatsApp(orderData: OrderNotificationData, oldStatus: string, newStatus: string) {
    try {
        console.log('📋 [TWILIO-WHATSAPP] Sending status update notification...')

        // Validate Twilio configuration
        if (!accountSid || !authToken) {
            console.error('❌ [TWILIO-WHATSAPP] Missing Twilio credentials for status update')
            return {
                success: false,
                error: 'Twilio credentials not configured'
            }
        }

        // Get admin phone number from environment
        const adminPhoneNumber = process.env.ADMIN_WHATSAPP_NUMBER || '+251944113998'
        const adminWhatsAppNumber = `whatsapp:${adminPhoneNumber}`

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

        // Send status update via Twilio
        const messageResponse = await client.messages.create({
            body: message,
            from: twilioWhatsAppNumber,
            to: adminWhatsAppNumber
        })

        console.log('✅ [TWILIO-WHATSAPP] Status update sent successfully!', {
            messageSid: messageResponse.sid,
            orderId: orderData.display_id
        })

        return {
            success: true,
            message: 'Status update notification sent via Twilio!',
            messageId: messageResponse.sid,
            method: 'twilio_whatsapp'
        }

    } catch (error) {
        console.error('💥 [TWILIO-WHATSAPP] Error sending status update:', error)

        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        }
    }
}

// Test function to verify Twilio WhatsApp setup
export async function testTwilioWhatsApp(testMessage: string = '🧪 Test message from Betty Organic - Twilio WhatsApp is working!') {
    try {
        console.log('🧪 [TWILIO-WHATSAPP] Testing Twilio WhatsApp connection...')

        if (!accountSid || !authToken) {
            return {
                success: false,
                error: 'Twilio credentials not configured. Please set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN environment variables.'
            }
        }

        const adminPhoneNumber = process.env.ADMIN_WHATSAPP_NUMBER || '+251944113998'
        const adminWhatsAppNumber = `whatsapp:${adminPhoneNumber}`

        const messageResponse = await client.messages.create({
            body: testMessage,
            from: twilioWhatsAppNumber,
            to: adminWhatsAppNumber
        })

        return {
            success: true,
            message: 'Test message sent successfully!',
            messageId: messageResponse.sid,
            status: messageResponse.status,
            to: adminWhatsAppNumber,
            from: twilioWhatsAppNumber
        }

    } catch (error) {
        console.error('❌ [TWILIO-WHATSAPP] Test failed:', error)

        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown test error'
        }
    }
}
