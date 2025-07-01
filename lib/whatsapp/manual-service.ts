'use server'

import { generateWhatsAppUrl } from './fallback-service'

// Manual WhatsApp service that doesn't require browser automation
export async function initializeManualMode(): Promise<{
  success: boolean
  message: string
  isManualMode: boolean
}> {
  return {
    success: true,
    message: 'Manual WhatsApp mode initialized',
    isManualMode: true
  }
}

export async function sendManualWhatsAppMessage({
  phoneNumber,
  message
}: {
  phoneNumber: string
  message: string
}): Promise<{
  success: boolean
  messageId?: string
  whatsappUrl?: string
  error?: string
}> {
  try {
    const whatsappUrl = await generateWhatsAppUrl(phoneNumber, message)
    
    return {
      success: true,
      messageId: 'manual_' + Date.now(),
      whatsappUrl
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate WhatsApp URL'
    }
  }
}

export async function getManualModeStatus(): Promise<{
  isReady: boolean
  isAuthenticating: boolean
  qrCode?: string
  sessionExists: boolean
  isManualMode: boolean
}> {
  return {
    isReady: true, // Manual mode is always "ready"
    isAuthenticating: false,
    sessionExists: false,
    isManualMode: true
  }
}

export async function testManualConnection(phoneNumber: string): Promise<{
  success: boolean
  message: string
  whatsappUrl?: string
}> {
  const testMessage = `🧪 *Test Message - Betty Organic*

This is a test message from your Betty Organic WhatsApp integration.

Provider: Manual Mode
Time: ${new Date().toLocaleString()}

If you can see this message, the WhatsApp integration is working correctly! ✅`

  try {
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