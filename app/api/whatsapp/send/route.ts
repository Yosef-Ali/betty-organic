import { NextRequest, NextResponse } from 'next/server'

interface WhatsAppMessage {
  to: string
  message: string
  type?: 'text' | 'template'
  template?: {
    name: string
    language: { code: string }
    components?: any[]
  }
}

export async function POST(request: NextRequest) {
  try {
    const { to, message, type = 'text', template }: WhatsAppMessage = await request.json()

    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID

    if (!accessToken || !phoneNumberId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'WhatsApp Cloud API credentials not configured. Please set WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID in your environment variables.' 
        },
        { status: 400 }
      )
    }

    // Clean phone number (remove + and any spaces)
    const cleanPhoneNumber = to.replace(/[\s+]/g, '')

    // Prepare message payload
    let messagePayload: any = {
      messaging_product: "whatsapp",
      to: cleanPhoneNumber,
      type: type
    }

    if (type === 'template' && template) {
      messagePayload.template = template
    } else {
      messagePayload.text = { body: message }
    }

    console.log('📱 Sending WhatsApp Cloud API message:', {
      to: cleanPhoneNumber,
      type,
      phoneNumberId
    })

    const response = await fetch(
      `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messagePayload)
      }
    )

    const data = await response.json()

    if (response.ok) {
      console.log('✅ WhatsApp Cloud API message sent successfully:', data.messages?.[0]?.id)
      return NextResponse.json({
        success: true,
        messageId: data.messages?.[0]?.id,
        data: data
      })
    } else {
      console.error('❌ WhatsApp Cloud API error:', data)
      return NextResponse.json(
        { 
          success: false, 
          error: data.error?.message || 'Failed to send WhatsApp message',
          details: data
        },
        { status: response.status }
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
    message: 'WhatsApp Cloud API endpoint is working',
    timestamp: new Date().toISOString(),
    configured: !!(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID)
  })
}
