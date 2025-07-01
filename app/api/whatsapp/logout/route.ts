import { NextRequest, NextResponse } from 'next/server'
import { logoutWhatsAppClient } from '@/lib/whatsapp/webjs-service'

export async function POST(request: NextRequest) {
  try {
    const result = await logoutWhatsAppClient()
    
    return NextResponse.json({
      success: result.success,
      message: result.message
    })
  } catch (error) {
    console.error('Error logging out WhatsApp client:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Logout failed' 
      },
      { status: 500 }
    )
  }
}