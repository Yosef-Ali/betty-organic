import { NextRequest, NextResponse } from 'next/server'
import { sendAdminWhatsAppNotification } from '@/app/actions/whatsappActions'

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Testing WhatsApp notification...')
    
    // Test data
    const testOrderData = {
      id: 'TEST-001',
      display_id: 'TEST-001',
      items: [
        {
          name: 'Test Apple',
          grams: 500,
          price: 25.00,
          unit_price: 50.00
        },
        {
          name: 'Test Orange', 
          grams: 300,
          price: 15.00,
          unit_price: 50.00
        }
      ],
      total: 40.00,
      customer_name: 'Test Customer',
      customer_phone: '+251947385509',
      delivery_address: 'Test Address, Addis Ababa',
      customer_email: 'test@example.com',
      user_id: null,
      created_at: new Date().toISOString()
    }

    console.log('📱 Sending test notification...')
    const result = await sendAdminWhatsAppNotification(testOrderData)
    
    console.log('✅ Test notification result:', {
      success: result.success,
      method: result.method,
      provider: result.provider,
      whatsappUrl: result.whatsappUrl ? 'Generated' : 'Not generated'
    })

    return NextResponse.json({
      success: true,
      testResult: result,
      message: 'WhatsApp test completed'
    })

  } catch (error) {
    console.error('❌ WhatsApp test failed:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Test failed' 
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'WhatsApp test endpoint ready',
    timestamp: new Date().toISOString(),
    env: {
      hasAccessToken: !!process.env.WHATSAPP_ACCESS_TOKEN,
      hasPhoneNumberId: !!process.env.WHATSAPP_PHONE_NUMBER_ID,
      provider: process.env.WHATSAPP_API_PROVIDER,
      adminNumber: process.env.ADMIN_WHATSAPP_NUMBER
    }
  })
}