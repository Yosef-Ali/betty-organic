import { NextRequest, NextResponse } from 'next/server'
import { sendWhatsAppMessage, getWhatsAppSettings } from '@/lib/whatsapp/core'

interface WhatsAppMessage {
  to: string
  message: string
  mediaPath?: string
  mediaCaption?: string
}

export async function POST(request: NextRequest) {
  try {
    const { to, message, mediaPath, mediaCaption }: WhatsAppMessage = await request.json()

    console.log('📱 Sending WhatsApp message via provider:', {
      to,
      hasMessage: !!message,
      hasMedia: !!mediaPath
    })

    // Get current settings
    const settings = await getWhatsAppSettings()
    if (!settings) {
      return NextResponse.json(
        {
          success: false,
          error: 'WhatsApp settings not configured'
        },
        { status: 500 }
      )
    }

    const result = await sendWhatsAppMessage(to, message, settings, mediaPath)

    if (result.success) {
      console.log('✅ WhatsApp message processed successfully:', result.messageId)
      return NextResponse.json({
        success: true,
        messageId: result.messageId,
        whatsappUrl: result.whatsappUrl
      })
    } else {
      console.error('❌ WhatsApp error:', result.error)
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to send WhatsApp message'
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('WhatsApp API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    )
  }
}

// GET method for testing
export async function GET() {
  return NextResponse.json({
    message: 'WhatsApp Web.js API endpoint is working',
    timestamp: new Date().toISOString(),
    provider: 'WhatsApp Web.js'
  })
}
