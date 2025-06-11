import { NextResponse } from 'next/server'

export async function GET() {
  // Check all WhatsApp environment variables
  const envStatus = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    whatsapp: {
      accessToken: {
        exists: !!process.env.WHATSAPP_ACCESS_TOKEN,
        length: process.env.WHATSAPP_ACCESS_TOKEN?.length || 0,
        isPlaceholder: process.env.WHATSAPP_ACCESS_TOKEN === 'YOUR_NEW_ACCESS_TOKEN_HERE',
        preview: process.env.WHATSAPP_ACCESS_TOKEN?.substring(0, 20) + '...' || 'NOT_SET'
      },
      phoneNumberId: {
        exists: !!process.env.WHATSAPP_PHONE_NUMBER_ID,
        value: process.env.WHATSAPP_PHONE_NUMBER_ID || 'NOT_SET'
      },
      adminNumber: {
        exists: !!process.env.ADMIN_WHATSAPP_NUMBER,
        value: process.env.ADMIN_WHATSAPP_NUMBER || 'NOT_SET'
      },
      provider: {
        value: process.env.WHATSAPP_API_PROVIDER || 'NOT_SET'
      },
      webhookToken: {
        exists: !!process.env.WEBHOOK_VERIFY_TOKEN,
        value: process.env.WEBHOOK_VERIFY_TOKEN || 'NOT_SET'
      }
    },
    issues: [] as string[]
  }

  // Check for common issues
  if (!envStatus.whatsapp.accessToken.exists) {
    envStatus.issues.push('❌ WHATSAPP_ACCESS_TOKEN not set in Vercel environment')
  } else if (envStatus.whatsapp.accessToken.isPlaceholder) {
    envStatus.issues.push('❌ WHATSAPP_ACCESS_TOKEN is still using placeholder value')
  } else if (envStatus.whatsapp.accessToken.length < 50) {
    envStatus.issues.push('⚠️ WHATSAPP_ACCESS_TOKEN seems too short (might be invalid)')
  }

  if (!envStatus.whatsapp.phoneNumberId.exists) {
    envStatus.issues.push('❌ WHATSAPP_PHONE_NUMBER_ID not set in Vercel environment')
  }

  if (!envStatus.whatsapp.adminNumber.exists) {
    envStatus.issues.push('❌ ADMIN_WHATSAPP_NUMBER not set in Vercel environment')
  }

  if (envStatus.whatsapp.provider.value !== 'cloud-api' && envStatus.whatsapp.provider.value !== 'manual') {
    envStatus.issues.push('⚠️ WHATSAPP_API_PROVIDER should be either "cloud-api" or "manual"')
  }

  // Add success messages if no issues
  if (envStatus.issues.length === 0) {
    envStatus.issues.push('✅ All WhatsApp environment variables are properly configured!')
  }

  return NextResponse.json(envStatus)
}

export async function POST() {
  // Test sending a WhatsApp message
  try {
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
    const adminNumber = process.env.ADMIN_WHATSAPP_NUMBER

    if (!accessToken || !phoneNumberId || !adminNumber) {
      return NextResponse.json({
        success: false,
        error: 'Missing required environment variables',
        missing: {
          accessToken: !accessToken,
          phoneNumberId: !phoneNumberId,
          adminNumber: !adminNumber
        }
      }, { status: 400 })
    }

    // Test the WhatsApp Cloud API
    const response = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: adminNumber.replace('+', ''),
        type: "text",
        text: {
          body: `🧪 Test from Betty Organic Vercel Deployment\n\nTimestamp: ${new Date().toLocaleString()}\n\nIf you received this message, your WhatsApp integration is working perfectly! ✅`
        }
      })
    })

    const result = await response.json()

    if (response.ok) {
      return NextResponse.json({
        success: true,
        messageId: result.messages?.[0]?.id,
        message: 'Test WhatsApp message sent successfully!',
        data: result
      })
    } else {
      return NextResponse.json({
        success: false,
        error: result.error?.message || 'WhatsApp API error',
        details: result
      }, { status: response.status })
    }

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
}