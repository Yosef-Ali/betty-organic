import { NextRequest, NextResponse } from 'next/server'
import { getWhatsAppConfig } from '@/lib/whatsapp/config'
import { getWhatsAppClientStatus, initializeWhatsAppClient } from '@/lib/whatsapp/webjs-service'
import { getCloudAPIStatus, initializeCloudAPI } from '@/lib/whatsapp/cloud-api-service'
import { getManualModeStatus, initializeManualMode } from '@/lib/whatsapp/manual-service'
import { getBaileysStatus, initializeBaileys } from '@/lib/whatsapp/baileys-service'

// Get status based on configured provider
async function getProviderStatus() {
  const config = getWhatsAppConfig()

  console.log(`🔍 Getting status for provider: ${config.provider}`)

  switch (config.provider) {
    case 'cloud-api':
      const cloudStatus = await getCloudAPIStatus()
      return {
        ...cloudStatus,
        provider: 'WhatsApp Cloud API',
        message: cloudStatus.isReady ? 'Cloud API Ready' : 'Cloud API Not Configured'
      }

    case 'whatsapp-web-js':
      const webjsStatus = await getWhatsAppClientStatus()
      return {
        ...webjsStatus,
        provider: 'WhatsApp Web.js',
        message: webjsStatus.isReady ? 'Web.js Ready' :
          webjsStatus.isAuthenticating ? 'Authenticating...' : 'Not Connected'
      }

    case 'baileys':
      const baileysStatus = await getBaileysStatus()
      return {
        ...baileysStatus,
        provider: 'Baileys WhatsApp',
        message: baileysStatus.isConnected ? 'Baileys Ready' :
          baileysStatus.isConnecting ? 'Connecting...' : 'Not Connected'
      }

    case 'manual':
    default:
      const manualStatus = await getManualModeStatus()
      return {
        ...manualStatus,
        provider: 'Manual Mode',
        message: 'Manual URLs Ready'
      }
  }
}

// Initialize based on configured provider
async function initializeProvider() {
  const config = getWhatsAppConfig()

  console.log(`🚀 Initializing provider: ${config.provider}`)

  switch (config.provider) {
    case 'cloud-api':
      return await initializeCloudAPI()

    case 'whatsapp-web-js':
      return await initializeWhatsAppClient()

    case 'baileys':
      return await initializeBaileys({
        sessionPath: './baileys-session',
        phoneNumber: process.env.ADMIN_PHONE_NUMBER || ''
      })

    case 'manual':
    default:
      return await initializeManualMode()
  }
}

export async function GET(request: NextRequest) {
  try {
    const status = await getProviderStatus()

    return NextResponse.json({
      success: true,
      status,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error getting WhatsApp provider status:', error)

    // Fall back to manual mode status on any error
    const manualStatus = await getManualModeStatus()

    return NextResponse.json({
      success: true,
      status: {
        ...manualStatus,
        provider: 'Manual Mode (Fallback)',
        message: 'Provider error - using manual mode'
      },
      timestamp: new Date().toISOString(),
      fallbackMode: true
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json()

    if (action === 'initialize') {
      console.log('🚀 API: Starting WhatsApp client initialization...')

      try {
        const result = await initializeWhatsAppClient()

        // If browser launch failed, return error with manual mode suggestion
        if (!result.success && (result.error?.includes('Browser') ||
          result.error?.includes('browser') ||
          result.error?.includes('automation'))) {
          console.log('🔄 Browser automation failed, suggesting manual mode')

          return NextResponse.json({
            success: false,
            error: 'Browser automation failed',
            fallbackAvailable: true,
            fallbackMessage: 'Browser automation unavailable. Consider using manual WhatsApp URLs or Cloud API instead.',
            suggestManualMode: true
          })
        }

        return NextResponse.json({
          success: result.success,
          message: result.message,
          qrCode: result.qrCode,
          error: result.error
        })

      } catch (initError) {
        console.error('💥 Initialization completely failed:', initError)

        const errorMessage = initError instanceof Error ? initError.message : 'Unknown initialization error'
        const isBrowserError = errorMessage.includes('Browser') ||
          errorMessage.includes('Puppeteer') ||
          errorMessage.includes('spawn') ||
          errorMessage.includes('ECONNREFUSED')

        return NextResponse.json({
          success: false,
          error: errorMessage,
          fallbackAvailable: isBrowserError,
          fallbackMessage: isBrowserError ?
            'WhatsApp Web.js browser automation failed. Manual WhatsApp URLs or Cloud API are available as alternatives.' :
            'WhatsApp initialization failed. Please check your configuration.'
        })
      }
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('💥 Error processing WhatsApp client action:', error)

    // Check if it's a browser/Puppeteer related error
    const errorMessage = error instanceof Error ? error.message : 'Action failed'
    const isBrowserError = errorMessage.includes('Browser') ||
      errorMessage.includes('Puppeteer') ||
      errorMessage.includes('spawn') ||
      errorMessage.includes('ECONNREFUSED')

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        fallbackAvailable: isBrowserError,
        fallbackMessage: isBrowserError ? 'Browser automation failed, but manual WhatsApp URLs are still available.' : undefined
      },
      { status: 500 }
    )
  }
}