import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  
  // Webhook verification (when setting up webhook in Meta Developer Console)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  console.log('📞 Webhook verification request:', { mode, token, challenge })

  if (mode === 'subscribe' && token === process.env.WEBHOOK_VERIFY_TOKEN) {
    console.log('✅ Webhook verified successfully')
    return new Response(challenge, { status: 200 })
  } else {
    console.log('❌ Webhook verification failed')
    return new Response('Forbidden', { status: 403 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('📨 Webhook received:', JSON.stringify(body, null, 2))

    // Process webhook data
    if (body.object === 'whatsapp_business_account') {
      const entry = body.entry?.[0]
      const changes = entry?.changes?.[0]
      const value = changes?.value

      if (value?.messages) {
        // Handle incoming messages
        for (const message of value.messages) {
          console.log('📧 Incoming WhatsApp message:', {
            from: message.from,
            type: message.type,
            text: message.text?.body,
            timestamp: message.timestamp
          })
          
          // You can add logic here to process incoming messages
          // For example, auto-replies, customer service routing, etc.
        }
      }

      if (value?.statuses) {
        // Handle message status updates (sent, delivered, read, failed)
        for (const status of value.statuses) {
          console.log('📊 Message status update:', {
            id: status.id,
            status: status.status,
            timestamp: status.timestamp,
            recipient_id: status.recipient_id
          })
          
          // You can add logic here to update message delivery status
          // in your database, send notifications, etc.
        }
      }
    }

    return NextResponse.json({ status: 'ok' })
  } catch (error) {
    console.error('❌ Webhook processing error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
