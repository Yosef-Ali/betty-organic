'use server'

// Fallback WhatsApp service for when Web.js fails
export async function generateWhatsAppUrl(phoneNumber: string, message: string): Promise<string> {
  const cleanPhone = phoneNumber.replace(/[^\d]/g, '')
  const formattedPhone = cleanPhone.startsWith('251') ? cleanPhone : `251${cleanPhone.substring(1)}`
  return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`
}

export async function testFallbackConnection(phoneNumber: string): Promise<{
  success: boolean
  message: string
  whatsappUrl?: string
}> {
  try {
    const testMessage = `🧪 *Test Message - Betty Organic*

This is a test message from your Betty Organic WhatsApp integration.

Provider: Manual URL (Fallback)
Time: ${new Date().toLocaleString()}

If you can see this message, the WhatsApp integration is working! ✅`

    const whatsappUrl = await generateWhatsAppUrl(phoneNumber, testMessage)
    
    return {
      success: true,
      message: 'Test WhatsApp URL generated successfully',
      whatsappUrl
    }
  } catch (error) {
    return {
      success: false,
      message: 'Failed to generate test URL'
    }
  }
}