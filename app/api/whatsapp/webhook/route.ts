import { NextRequest, NextResponse } from 'next/server'
import { getWhatsAppConfig, verifyWebhookSignature } from '@/lib/whatsapp/config'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  
  // Webhook verification (when setting up webhook in Meta Developer Console)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  console.log('📞 Webhook verification request:', { mode, token, challenge })

  const config = getWhatsAppConfig()
  const expectedToken = config.cloudApi.webhookVerifyToken
  
  if (!expectedToken) {
    console.log('❌ Webhook verify token not configured')
    return new Response('Webhook verify token not configured', { status: 500 })
  }

  if (mode === 'subscribe' && token === expectedToken) {
    console.log('✅ Webhook verified successfully')
    return new Response(challenge, { status: 200 })
  } else {
    console.log('❌ Webhook verification failed')
    return new Response('Forbidden', { status: 403 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()
    const body = JSON.parse(rawBody)
    
    console.log('📨 Webhook received:', JSON.stringify(body, null, 2))
    
    // Security validation
    const config = getWhatsAppConfig()
    if (config.cloudApi.appSecret) {
      const signature = request.headers.get('x-hub-signature-256') || request.headers.get('x-hub-signature')
      
      if (!signature) {
        console.error('❌ Webhook signature missing')
        return NextResponse.json(
          { error: 'Signature required' },
          { status: 401 }
        )
      }
      
      if (!verifyWebhookSignature(rawBody, signature, config.cloudApi.appSecret)) {
        console.error('❌ Webhook signature verification failed')
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        )
      }
      
      console.log('✅ Webhook signature verified')
    } else {
      console.warn('⚠️ Webhook signature verification disabled (no app secret configured)')
    }

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
          
          // Store delivery status in database
          await updateMessageDeliveryStatus({
            messageId: status.id,
            status: status.status,
            timestamp: status.timestamp,
            recipientId: status.recipient_id,
            errors: status.errors
          })
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

// Store message delivery status for tracking
async function updateMessageDeliveryStatus(statusData: {
  messageId: string
  status: string
  timestamp: string
  recipientId: string
  errors?: any[]
}) {
  try {
    const supabase = createClient()
    
    // Create table if it doesn't exist (you may want to do this via migration)
    // This is just for the sake of this implementation
    
    const { error } = await supabase
      .from('whatsapp_message_status')
      .upsert({
        message_id: statusData.messageId,
        status: statusData.status,
        timestamp: new Date(parseInt(statusData.timestamp) * 1000).toISOString(),
        recipient_id: statusData.recipientId,
        errors: statusData.errors,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'message_id'
      })
    
    if (error) {
      console.error('Failed to store message status:', error)
    } else {
      console.log('✅ Message status stored:', statusData.messageId, statusData.status)
    }
  } catch (error) {
    console.error('Error storing message status:', error)
  }
}
