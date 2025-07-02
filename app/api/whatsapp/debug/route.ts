import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { getWhatsAppClientStatus } = await import('@/lib/whatsapp/webjs-service')
    const status = await getWhatsAppClientStatus()
    
    console.log('📱 WhatsApp status check:', status)
    
    return NextResponse.json({
      success: true,
      status,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error checking WhatsApp status:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Status check failed'
    }, { status: 500 })
  }
}
