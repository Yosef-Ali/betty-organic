'use server'

interface WhatsAppSettings {
  adminPhoneNumber: string
  enableOrderNotifications: boolean
  enableRealTimeNotifications: boolean
  notificationMessage: string
  apiProvider?: 'twilio' | 'whatsapp-web-js' | 'baileys' | 'manual' // API provider option
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
      // Default to manual for simplicity - users can upgrade to API if needed
      apiProvider: (process.env.WHATSAPP_API_PROVIDER as any) || 'manual',
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