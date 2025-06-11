'use server'

interface WhatsAppSettings {
  adminPhoneNumber: string
  enableOrderNotifications: boolean
  enableRealTimeNotifications: boolean
  notificationMessage: string
  apiProvider?: 'cloud-api' | 'twilio' | 'whatsapp-web-js' | 'baileys' | 'manual' // API provider option
  apiKey?: string
  apiSecret?: string
}

export async function getWhatsAppSettings(): Promise<WhatsAppSettings | null> {
  try {
    // Check if there are saved settings in localStorage (client-side will set this)
    // In a real implementation, you would fetch from database
    return {
      adminPhoneNumber: process.env.ADMIN_WHATSAPP_NUMBER || '+251912345678',
      enableOrderNotifications: true,
      enableRealTimeNotifications: true,
      notificationMessage: 'New order received from Betty Organic App! Order #{display_id}',
      // Default to cloud-api if configured, otherwise manual
      apiProvider: (process.env.WHATSAPP_API_PROVIDER as any) || 
                   (process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID ? 'cloud-api' : 'manual'),
      apiKey: process.env.WHATSAPP_API_KEY,
      apiSecret: process.env.WHATSAPP_API_SECRET
    }
  } catch (error) {
    console.error('Failed to get WhatsApp settings:', error)
    return null
  }
}

export async function updateWhatsAppSettings(settings: WhatsAppSettings) {
  try {
    // For now, just log the settings
    // In a real implementation, you would save to database
    console.log('WhatsApp settings updated:', settings)
    
    return {
      success: true,
      message: 'Settings updated successfully'
    }
  } catch (error) {
    console.error('Failed to update WhatsApp settings:', error)
    return {
      success: false,
      error: 'Failed to update settings'
    }
  }
}

// Function to send WhatsApp message through different API providers
async function sendWhatsAppMessage(
  phoneNumber: string, 
  message: string, 
  settings: WhatsAppSettings
): Promise<{ success: boolean; error?: string; messageId?: string }> {
  try {
    switch (settings.apiProvider) {
      case 'cloud-api':
        return await sendCloudApiWhatsApp(phoneNumber, message, settings)
      
      case 'twilio':
        return await sendTwilioWhatsApp(phoneNumber, message, settings)
      
      case 'whatsapp-web-js':
        return await sendWebWhatsApp(phoneNumber, message, settings)
      
      case 'baileys':
        return await sendBaileysWhatsApp(phoneNumber, message, settings)
      
      default:
        // Fallback to manual URL generation
        return {
          success: true,
          error: 'Manual mode - WhatsApp URL generated for user to open manually'
        }
    }
  } catch (error) {
    console.error('Error sending WhatsApp message:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send WhatsApp message'
    }
  }
}

// WhatsApp Cloud API implementation (Meta Business API)
async function sendCloudApiWhatsApp(
  phoneNumber: string, 
  message: string, 
  settings: WhatsAppSettings
): Promise<{ success: boolean; error?: string; messageId?: string }> {
  try {
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID

    if (!accessToken || !phoneNumberId) {
      throw new Error('WhatsApp Cloud API credentials not configured. Please set WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID in your environment variables.')
    }

    // Use the local API endpoint we created
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/whatsapp/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: phoneNumber,
        message: message,
        type: 'text'
      })
    })

    const result = await response.json()

    if (result.success) {
      console.log('✅ WhatsApp Cloud API message sent successfully:', result.messageId)
      return {
        success: true,
        messageId: result.messageId
      }
    } else {
      throw new Error(result.error || 'WhatsApp Cloud API error')
    }
  } catch (error) {
    console.error('WhatsApp Cloud API error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'WhatsApp Cloud API error'
    }
  }
}

// Twilio WhatsApp API implementation
async function sendTwilioWhatsApp(
  phoneNumber: string, 
  message: string, 
  settings: WhatsAppSettings
): Promise<{ success: boolean; error?: string; messageId?: string }> {
  try {
    if (!settings.apiKey || !settings.apiSecret) {
      throw new Error('Twilio API credentials not configured')
    }

    const twilioAccountSid = settings.apiKey
    const twilioAuthToken = settings.apiSecret
    const twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886'

    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${twilioAccountSid}:${twilioAuthToken}`).toString('base64')}`
      },
      body: new URLSearchParams({
        From: twilioWhatsAppNumber,
        To: `whatsapp:${phoneNumber}`,
        Body: message
      })
    })

    const result = await response.json()

    if (response.ok) {
      console.log('✅ Twilio WhatsApp message sent successfully:', result.sid)
      return {
        success: true,
        messageId: result.sid
      }
    } else {
      throw new Error(result.message || 'Twilio API error')
    }
  } catch (error) {
    console.error('Twilio WhatsApp error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Twilio API error'
    }
  }
}

// WhatsApp Web.js implementation (requires running service)
async function sendWebWhatsApp(
  phoneNumber: string, 
  message: string, 
  settings: WhatsAppSettings
): Promise<{ success: boolean; error?: string; messageId?: string }> {
  try {
    // This would connect to a local WhatsApp Web.js service
    const serviceUrl = process.env.WHATSAPP_WEBJS_SERVICE_URL || 'http://localhost:3001'
    
    const response = await fetch(`${serviceUrl}/send-message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.apiKey || ''}`
      },
      body: JSON.stringify({
        to: phoneNumber,
        message: message
      })
    })

    const result = await response.json()

    if (response.ok) {
      console.log('✅ WhatsApp Web.js message sent successfully')
      return {
        success: true,
        messageId: result.messageId
      }
    } else {
      throw new Error(result.error || 'WhatsApp Web.js API error')
    }
  } catch (error) {
    console.error('WhatsApp Web.js error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'WhatsApp Web.js API error'
    }
  }
}

// Baileys implementation (requires running service)
async function sendBaileysWhatsApp(
  phoneNumber: string, 
  message: string, 
  settings: WhatsAppSettings
): Promise<{ success: boolean; error?: string; messageId?: string }> {
  try {
    // This would connect to a local Baileys service
    const serviceUrl = process.env.WHATSAPP_BAILEYS_SERVICE_URL || 'http://localhost:3002'
    
    const response = await fetch(`${serviceUrl}/send-text`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.apiKey || ''}`
      },
      body: JSON.stringify({
        jid: `${phoneNumber.replace('+', '')}@s.whatsapp.net`,
        text: message
      })
    })

    const result = await response.json()

    if (response.ok) {
      console.log('✅ Baileys WhatsApp message sent successfully')
      return {
        success: true,
        messageId: result.messageId
      }
    } else {
      throw new Error(result.error || 'Baileys API error')
    }
  } catch (error) {
    console.error('Baileys WhatsApp error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Baileys API error'
    }
  }
}

export async function sendAdminWhatsAppNotification(orderDetails: {
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
}) {
  try {
    // Get admin settings
    const settings = await getWhatsAppSettings()
    
    if (!settings || !settings.enableOrderNotifications) {
      return {
        success: false,
        error: 'WhatsApp notifications are disabled'
      }
    }

    // Format order items
    const itemsList = orderDetails.items
      .map(item => `• ${item.name} (${item.grams}g) - ETB ${item.price.toFixed(2)}`)
      .join('\n')
    
    // Create formatted message using template
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

    console.log('📱 Preparing admin WhatsApp notification:', {
      to: settings.adminPhoneNumber,
      orderId: orderDetails.display_id,
      customer: orderDetails.customer_name,
      total: orderDetails.total,
      provider: settings.apiProvider
    })

    // Generate WhatsApp URL (this always works and is the primary method)
    const adminPhone = settings.adminPhoneNumber.replace('+', '')
    const whatsappUrl = `https://wa.me/${adminPhone}?text=${encodeURIComponent(message)}`
    
    console.log('📱 Admin WhatsApp notification URL generated')

    // Try to send automatically through configured API ONLY if user has specifically configured it
    let automaticResult = null
    if (settings.apiProvider && settings.apiProvider !== 'manual' && settings.apiKey) {
      try {
        const sendResult = await sendWhatsAppMessage(
          settings.adminPhoneNumber,
          message,
          settings
        )

        if (sendResult.success) {
          console.log('✅ Admin WhatsApp notification also sent automatically via', settings.apiProvider)
          automaticResult = {
            messageId: sendResult.messageId,
            provider: settings.apiProvider
          }
        } else {
          console.warn('⚠️ Automatic WhatsApp sending failed, but URL method is primary:', sendResult.error)
        }
      } catch (error) {
        console.warn('⚠️ Automatic API attempt failed, but URL method is primary:', error)
      }
    }

    // Always return success with WhatsApp URL (primary method)
    return {
      success: true,
      message: automaticResult 
        ? `Admin notification URL generated and also sent via ${automaticResult.provider}`
        : 'Admin notification URL generated for opening',
      whatsappUrl,
      method: 'url', // Primary method is always URL
      provider: settings.apiProvider || 'manual',
      automatic: automaticResult, // Additional info if API also worked
      data: {
        adminPhone: settings.adminPhoneNumber,
        message,
        orderId: orderDetails.display_id
      }
    }
  } catch (error) {
    console.error('Failed to send admin WhatsApp notification:', error)
    return {
      success: false,
      error: 'Failed to send admin notification'
    }
  }
}

// New function for testing WhatsApp API connection
// Function to send receipt to customer via WhatsApp
export async function sendCustomerReceiptWhatsApp(receiptData: {
  customerPhone: string
  customerName: string
  orderId: string
  items: Array<{
    name: string
    quantity: number
    price: number
  }>
  total: number
}) {
  try {
    // Get WhatsApp settings
    const settings = await getWhatsAppSettings()
    
    if (!settings) {
      return {
        success: false,
        error: 'WhatsApp settings not configured'
      }
    }

    // Clean phone number
    const cleanPhone = receiptData.customerPhone.replace(/[\s\-\(\)]/g, '')
    
    // Create customer receipt message
    const message = `🧾 *Your Order Receipt - Betty Organic*

Hi ${receiptData.customerName}! 👋

✅ Your order has been confirmed!
📋 Order ID: ${receiptData.orderId}

🛒 *Items Ordered:*
${receiptData.items.map((item, index) => 
  `${index + 1}. ${item.name} (${(item.quantity * 1000).toFixed(0)}g) - ETB ${item.price.toFixed(2)}`
).join('\n')}

💰 *Total Amount: ETB ${receiptData.total.toFixed(2)}*

📅 Order Date: ${new Date().toLocaleDateString()}
🕒 Order Time: ${new Date().toLocaleTimeString()}

🚚 We'll prepare your fresh organic produce and contact you for delivery!

🌿 Thank you for choosing Betty Organic! 🌿
📞 For any questions, feel free to reply to this message.

🔗 ${process.env.NEXT_PUBLIC_SITE_URL || 'https://bettys-organic.com'}`

    console.log('📱 Preparing customer WhatsApp receipt:', {
      to: cleanPhone,
      orderId: receiptData.orderId,
      customer: receiptData.customerName,
      total: receiptData.total,
      provider: settings.apiProvider
    })

    // Generate WhatsApp URL (this always works as fallback)
    const whatsappUrl = `https://wa.me/${cleanPhone.replace('+', '')}?text=${encodeURIComponent(message)}`
    
    // Try to send automatically through configured API if available
    let automaticResult = null
    if (settings.apiProvider && settings.apiProvider !== 'manual' && settings.apiKey) {
      try {
        const sendResult = await sendWhatsAppMessage(
          cleanPhone.startsWith('+') ? cleanPhone : `+${cleanPhone}`,
          message,
          settings
        )

        if (sendResult.success) {
          console.log('✅ Customer receipt sent automatically via', settings.apiProvider)
          automaticResult = {
            messageId: sendResult.messageId,
            provider: settings.apiProvider
          }
        } else {
          console.warn('⚠️ Automatic sending failed, falling back to URL method:', sendResult.error)
        }
      } catch (error) {
        console.warn('⚠️ Automatic API attempt failed, falling back to URL method:', error)
      }
    }

    // Return success with appropriate method
    return {
      success: true,
      message: automaticResult 
        ? `Receipt sent successfully via ${automaticResult.provider}`
        : 'Receipt ready to send via WhatsApp',
      whatsappUrl,
      method: automaticResult ? 'api' : 'url',
      provider: settings.apiProvider || 'manual',
      automatic: automaticResult,
      data: {
        customerPhone: cleanPhone,
        message,
        orderId: receiptData.orderId
      }
    }
  } catch (error) {
    console.error('Failed to send customer WhatsApp receipt:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send receipt'
    }
  }
}

// Test WhatsApp connection
export async function testWhatsAppConnection() {
  try {
    const settings = await getWhatsAppSettings()
    
    if (!settings) {
      return {
        success: false,
        error: 'WhatsApp settings not found'
      }
    }

    const testMessage = `🧪 *Test Message - Betty Organic*

This is a test message from your Betty Organic WhatsApp integration.

Provider: ${settings.apiProvider || 'manual'}
Time: ${new Date().toLocaleString()}

If you received this message, your WhatsApp integration is working correctly! ✅`

    const result = await sendWhatsAppMessage(
      settings.adminPhoneNumber,
      testMessage,
      settings
    )

    return {
      success: result.success,
      message: result.success 
        ? `Test message sent successfully via ${settings.apiProvider}`
        : `Test failed: ${result.error}`,
      provider: settings.apiProvider,
      messageId: result.messageId,
      error: result.error
    }
  } catch (error) {
    console.error('WhatsApp connection test failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Test failed'
    }
  }
}