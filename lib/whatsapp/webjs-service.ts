'use server'

import { Client, LocalAuth, MessageMedia } from 'whatsapp-web.js'
import { getWhatsAppConfig } from './config'
import path from 'path'
import fs from 'fs'

interface WhatsAppWebJsClient {
  client: Client | null
  isReady: boolean
  isAuthenticating: boolean
  qrCode: string | null
  sessionPath: string
}

// Global client instance
let whatsappClient: WhatsAppWebJsClient = {
  client: null,
  isReady: false,
  isAuthenticating: false,
  qrCode: null,
  sessionPath: ''
}

// Initialize WhatsApp Web.js client
// Check if browser/Puppeteer is available
async function checkBrowserAvailability(): Promise<{ available: boolean; error?: string }> {
  try {
    const puppeteer = require('puppeteer')

    // Try to get browser executable path
    const executablePath = puppeteer.executablePath()
    console.log('🔍 Browser executable path:', executablePath)

    // Check if the executable exists
    const fs = require('fs')
    if (!fs.existsSync(executablePath)) {
      return {
        available: false,
        error: 'Browser executable not found at: ' + executablePath
      }
    }

    console.log('✅ Browser executable found and verified')
    return { available: true }
  } catch (error) {
    return {
      available: false,
      error: error instanceof Error ? error.message : 'Browser check failed'
    }
  }
}

export async function initializeWhatsAppClient(): Promise<{
  success: boolean
  message: string
  qrCode?: string
  error?: string
}> {
  try {
    // Check if we're in a browser environment (this should run server-side)
    if (typeof window !== 'undefined') {
      return {
        success: false,
        message: 'WhatsApp Web.js must run server-side',
        error: 'This function cannot run in the browser'
      }
    }

    // Check if required dependencies are available
    if (!Client || !LocalAuth) {
      return {
        success: false,
        message: 'WhatsApp Web.js dependencies not available',
        error: 'Please ensure whatsapp-web.js is properly installed'
      }
    }

    // Check browser availability before attempting initialization
    console.log('🔍 Checking browser availability...')
    const browserCheck = await checkBrowserAvailability()
    if (!browserCheck.available) {
      console.log('❌ Browser not available:', browserCheck.error)
      return {
        success: false,
        message: 'Browser automation not available',
        error: `Browser launch failed: ${browserCheck.error}. Manual WhatsApp URLs will be used instead.`
      }
    }
    console.log('✅ Browser availability confirmed')
    if (whatsappClient.client && whatsappClient.isReady) {
      return {
        success: true,
        message: 'WhatsApp client is already initialized and ready'
      }
    }

    if (whatsappClient.isAuthenticating) {
      return {
        success: false,
        message: 'WhatsApp client is already authenticating',
        qrCode: whatsappClient.qrCode || undefined
      }
    }

    const config = getWhatsAppConfig()
    const sessionPath = path.resolve(config.webJs.sessionPath || './whatsapp-session')
    whatsappClient.sessionPath = sessionPath

    // Ensure session directory exists
    if (!fs.existsSync(sessionPath)) {
      fs.mkdirSync(sessionPath, { recursive: true })
    }

    console.log('🔧 Initializing WhatsApp Web.js client...')
    console.log('📁 Session path:', sessionPath)

    whatsappClient.isAuthenticating = true
    whatsappClient.qrCode = null

    // Create WhatsApp client with robust Puppeteer config
    const puppeteer = require('puppeteer')

    // For local development on macOS, use non-headless mode for better compatibility
    const isLocalDev = process.env.NODE_ENV !== 'production'
    const isMacOS = process.platform === 'darwin'

    const puppeteerConfig = {
      headless: !(isLocalDev && isMacOS), // Use visible browser on macOS for local dev
      timeout: 90000, // 90 second timeout for better compatibility
      executablePath: puppeteer.executablePath(), // Use the correct Puppeteer browser path
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--no-first-run',
        '--disable-web-security',
        '--disable-background-timer-throttling',
        '--disable-renderer-backgrounding',
        '--disable-backgrounding-occluded-windows',
        '--window-size=1366,768',
        '--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      ]
    };

    // Platform-specific configurations
    if (process.platform === 'darwin') {
      // macOS specific - better Chrome compatibility
      puppeteerConfig.args.push(
        '--disable-default-apps',
        '--disable-extensions-except',
        '--disable-plugins-discovery',
        '--allow-running-insecure-content'
      );      // For local development, try to use system Chrome if available
      if (isLocalDev) {
        const systemChromePaths = [
          '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
          '/Applications/Chromium.app/Contents/MacOS/Chromium'
        ];

        // Only use system Chrome if it exists and we're not having issues
        let useSystemChrome = false
        for (const chromePath of systemChromePaths) {
          if (fs.existsSync(chromePath)) {
            // For now, let's use bundled Chrome to avoid session issues
            // puppeteerConfig.executablePath = chromePath;
            console.log('🔍 Found system Chrome at:', chromePath, '(using bundled for stability)');
            useSystemChrome = true
            break;
          }
        }

        if (!useSystemChrome) {
          console.log('🔍 No system Chrome found, using bundled Puppeteer Chrome');
        }
      }
    } else if (process.platform === 'linux') {
      // Linux specific (common in production)
      puppeteerConfig.args.push('--disable-dev-shm-usage', '--single-process');
    }

    console.log('🔧 Creating WhatsApp client with config:', {
      platform: process.platform,
      sessionPath,
      headless: puppeteerConfig.headless,
      isLocalDev,
      isMacOS,
      executablePath: puppeteerConfig.executablePath.includes('Puppeteer') ? 'Bundled Puppeteer Chrome' : puppeteerConfig.executablePath
    })

    if (isLocalDev && isMacOS && !puppeteerConfig.headless) {
      console.log('📱 Running in visible browser mode on macOS for better WhatsApp Web compatibility')
      console.log('🔍 A Chrome browser window will open - this is normal and required for WhatsApp Web.js')
    }

    try {
      whatsappClient.client = new Client({
        authStrategy: new LocalAuth({
          clientId: 'betty-organic-app',
          dataPath: sessionPath
        }),
        puppeteer: puppeteerConfig,
        webVersionCache: {
          type: 'remote',
          remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html',
        }
      })
      console.log('✅ WhatsApp client created successfully')

      // Add a small delay to allow Chrome to fully start
      await new Promise(resolve => setTimeout(resolve, 2000))

    } catch (clientError) {
      console.error('❌ Failed to create WhatsApp client:', clientError)
      throw new Error(`Failed to create WhatsApp client: ${clientError instanceof Error ? clientError.message : 'Unknown error'}`)
    }

    // Set up event handlers
    whatsappClient.client.on('qr', (qr) => {
      console.log('📱 QR Code received, scan with WhatsApp mobile app')
      console.log('🔍 Make sure to scan the QR code that appears in your web browser interface')
      whatsappClient.qrCode = qr
    })

    whatsappClient.client.on('ready', () => {
      console.log('✅ WhatsApp Web.js client is ready!')
      whatsappClient.isReady = true
      whatsappClient.isAuthenticating = false
      whatsappClient.qrCode = null
    })

    whatsappClient.client.on('authenticated', () => {
      console.log('🔐 WhatsApp client authenticated successfully')
      console.log('✅ Connection established - browser automation is working correctly')
    })

    whatsappClient.client.on('auth_failure', (message) => {
      console.error('❌ WhatsApp authentication failed:', message)
      console.log('💡 Try refreshing the QR code or restarting the connection')
      whatsappClient.isAuthenticating = false
      whatsappClient.isReady = false

      if (config.webJs.restartOnAuthFail) {
        console.log('🔄 Restarting client due to auth failure...')
        setTimeout(() => {
          initializeWhatsAppClient()
        }, 5000)
      }
    })

    whatsappClient.client.on('disconnected', (reason) => {
      console.log('📱 WhatsApp client disconnected:', reason)
      console.log('💡 You may need to scan the QR code again')
      whatsappClient.isReady = false
      whatsappClient.isAuthenticating = false
    })

    whatsappClient.client.on('message', async (message) => {
      console.log('📨 Received message:', message.body)
      // Handle incoming messages if needed
    })

    // Initialize the client with timeout and better error handling
    try {
      console.log('🚀 Starting WhatsApp client initialization...')
      console.log('⏳ Waiting for browser to stabilize...')

      // Wait a bit more for the browser to be ready
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Set a timeout for initialization
      const initTimeout = 60000 // 60 seconds for first-time setup

      const initPromise = whatsappClient.client.initialize()

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          console.warn('⚠️ WhatsApp client initialization timeout - this may be normal for first-time setup')
          reject(new Error('Initialization timeout after 60 seconds'))
        }, initTimeout)
      })

      await Promise.race([initPromise, timeoutPromise])
      console.log('✅ WhatsApp client initialization started successfully')

    } catch (initError) {
      console.error('❌ Failed to initialize WhatsApp client:', initError)
      whatsappClient.isAuthenticating = false

      // Cleanup any partial initialization
      if (whatsappClient.client) {
        try {
          console.log('🧹 Cleaning up partial WhatsApp client initialization...')

          // First, try to check if the client is properly initialized
          const isClientReady = whatsappClient.client &&
            typeof whatsappClient.client.destroy === 'function' &&
            whatsappClient.client.info !== undefined

          if (isClientReady) {
            console.log('🔄 Destroying fully initialized client...')
            try {
              await whatsappClient.client.destroy()
              console.log('✅ Client destroyed successfully')
            } catch (destroyError) {
              console.warn('⚠️ Error during destroy, continuing with cleanup:', destroyError)
            }
          } else {
            console.log('🔄 Cleaning up partially initialized client...')

            // Try different cleanup approaches for partial initialization
            let browserClosed = false

            if (whatsappClient.client.pupPage) {
              try {
                await whatsappClient.client.pupPage.close()
                console.log('✅ Browser page closed')
                browserClosed = true
              } catch (pageError) {
                console.warn('⚠️ Error closing browser page:', pageError)
              }
            }

            if (whatsappClient.client.pupBrowser) {
              try {
                await whatsappClient.client.pupBrowser.close()
                console.log('✅ Browser instance closed')
                browserClosed = true
              } catch (browserError) {
                console.warn('⚠️ Error closing browser:', browserError)
              }
            }

            // Only try to destroy if we haven't already closed the browser components
            // and if the client seems to be in a valid state
            if (!browserClosed &&
              typeof whatsappClient.client.destroy === 'function' &&
              whatsappClient.client.pupPage !== null) {
              try {
                console.log('🔄 Attempting controlled client destroy...')
                const destroyPromise = whatsappClient.client.destroy()
                const timeoutPromise = new Promise((_, reject) =>
                  setTimeout(() => reject(new Error('Destroy timeout')), 3000)
                )
                await Promise.race([destroyPromise, timeoutPromise])
                console.log('✅ Client destroyed with timeout protection')
              } catch (destroyError) {
                console.warn('⚠️ Destroy method failed (this is normal for partial initialization):', destroyError instanceof Error ? destroyError.message : destroyError)
              }
            } else {
              console.log('⏭️ Skipping destroy call - browser already closed or client in invalid state')
            }
          }
        } catch (cleanupError) {
          console.warn('⚠️ Error during client cleanup:', cleanupError)
        } finally {
          // Always reset the client state
          whatsappClient.client = null
          whatsappClient.isReady = false
          whatsappClient.isAuthenticating = false
          whatsappClient.qrCode = null
          console.log('✅ Client state reset')
        }
      }

      // Determine error type and provide appropriate response
      const errorMessage = initError instanceof Error ? initError.message : 'Unknown error'

      if (errorMessage.includes('timeout') ||
        errorMessage.includes('Browser') ||
        errorMessage.includes('Puppeteer') ||
        errorMessage.includes('ECONNREFUSED') ||
        errorMessage.includes('spawn') ||
        errorMessage.includes('ENOENT')) {
        return {
          success: false,
          message: 'Browser automation failed',
          error: 'WhatsApp Web.js browser could not be launched. Manual WhatsApp URLs will be used instead.'
        }
      }

      return {
        success: false,
        message: 'WhatsApp client initialization failed',
        error: errorMessage
      }
    }

    // Wait for authentication or timeout
    const authTimeout = config.webJs.authTimeout || 60000
    const startTime = Date.now()

    console.log(`⏱️ Waiting for authentication (timeout: ${authTimeout}ms)...`)

    while (!whatsappClient.isReady && (Date.now() - startTime) < authTimeout) {
      if (whatsappClient.qrCode) {
        console.log('📱 QR Code generated, returning to user')
        return {
          success: false,
          message: 'QR Code generated. Please scan with WhatsApp mobile app.',
          qrCode: whatsappClient.qrCode
        }
      }
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    if (whatsappClient.isReady) {
      console.log('🎉 WhatsApp client ready!')
      return {
        success: true,
        message: 'WhatsApp client initialized and ready'
      }
    } else {
      console.log('⏰ Authentication timeout')
      whatsappClient.isAuthenticating = false
      return {
        success: false,
        message: 'Authentication timeout. Please try again.',
        error: 'Authentication timeout'
      }
    }

  } catch (error) {
    console.error('💥 Error initializing WhatsApp client:', error)
    whatsappClient.isAuthenticating = false
    whatsappClient.isReady = false

    return {
      success: false,
      message: 'Failed to initialize WhatsApp client',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Send message using WhatsApp Web.js
export async function sendWhatsAppWebJsMessage({
  phoneNumber,
  message,
  mediaPath,
  mediaCaption
}: {
  phoneNumber: string
  message?: string
  mediaPath?: string
  mediaCaption?: string
}): Promise<{
  success: boolean
  messageId?: string
  error?: string
}> {
  try {
    if (!whatsappClient.client || !whatsappClient.isReady) {
      const initResult = await initializeWhatsAppClient()
      if (!initResult.success) {
        return {
          success: false,
          error: 'WhatsApp client not ready: ' + initResult.message
        }
      }
    }

    // Format phone number (remove all non-digits, then add country code if needed)
    let formattedNumber = phoneNumber.replace(/\D/g, '')

    // Add country code if not present (assuming Ethiopian numbers)
    if (!formattedNumber.startsWith('251') && formattedNumber.length === 10) {
      formattedNumber = '251' + formattedNumber.substring(1)
    }

    const chatId = formattedNumber + '@c.us'

    console.log('📤 Sending WhatsApp message to:', chatId)

    let messageResult

    if (mediaPath && fs.existsSync(mediaPath)) {
      // Send media message
      console.log('📎 Sending media message with file:', mediaPath)
      const media = MessageMedia.fromFilePath(mediaPath)

      messageResult = await whatsappClient.client!.sendMessage(chatId, media, {
        caption: mediaCaption || message
      })
    } else if (message) {
      // Send text message
      console.log('💬 Sending text message')
      messageResult = await whatsappClient.client!.sendMessage(chatId, message)
    } else {
      return {
        success: false,
        error: 'No message content or media provided'
      }
    }

    console.log('✅ Message sent successfully:', messageResult.id._serialized)

    return {
      success: true,
      messageId: messageResult.id._serialized
    }

  } catch (error) {
    console.error('💥 Error sending WhatsApp message:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send message'
    }
  }
}

// Get client status
export async function getWhatsAppClientStatus(): Promise<{
  isReady: boolean
  isAuthenticating: boolean
  qrCode?: string
  sessionExists: boolean
}> {
  const sessionExists = fs.existsSync(whatsappClient.sessionPath) &&
    fs.readdirSync(whatsappClient.sessionPath).length > 0

  return {
    isReady: whatsappClient.isReady,
    isAuthenticating: whatsappClient.isAuthenticating,
    qrCode: whatsappClient.qrCode || undefined,
    sessionExists
  }
}

// Logout and clear session
export async function logoutWhatsAppClient(): Promise<{
  success: boolean
  message: string
}> {
  try {
    console.log('🔄 Starting WhatsApp client logout process...')

    if (whatsappClient.client) {
      try {
        // First try to logout properly
        if (typeof whatsappClient.client.logout === 'function') {
          console.log('📤 Logging out from WhatsApp...')
          await whatsappClient.client.logout()
          console.log('✅ WhatsApp logout successful')
        }

        // Then try to destroy the client with proper error handling
        if (typeof whatsappClient.client.destroy === 'function') {
          console.log('🧹 Destroying WhatsApp client...')

          // Use timeout protection for destroy method
          const destroyPromise = whatsappClient.client.destroy()
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Destroy timeout after 10 seconds')), 10000)
          )

          try {
            await Promise.race([destroyPromise, timeoutPromise])
            console.log('✅ WhatsApp client destroyed successfully')
          } catch (destroyError) {
            console.warn('⚠️ Destroy method timed out or failed, forcing cleanup:', destroyError)

            // Force cleanup of browser resources
            if (whatsappClient.client.pupPage) {
              try {
                await whatsappClient.client.pupPage.close()
              } catch (pageError) {
                console.warn('⚠️ Error closing page during forced cleanup:', pageError)
              }
            }

            if (whatsappClient.client.pupBrowser) {
              try {
                await whatsappClient.client.pupBrowser.close()
              } catch (browserError) {
                console.warn('⚠️ Error closing browser during forced cleanup:', browserError)
              }
            }
          }
        }
      } catch (clientError) {
        console.warn('⚠️ Error during client logout/cleanup:', clientError)
      }
    }

    // Clear session files
    if (fs.existsSync(whatsappClient.sessionPath)) {
      console.log('🗑️ Clearing session files...')
      fs.rmSync(whatsappClient.sessionPath, { recursive: true, force: true })
      console.log('✅ Session files cleared')
    }

    // Reset client state
    whatsappClient = {
      client: null,
      isReady: false,
      isAuthenticating: false,
      qrCode: null,
      sessionPath: ''
    }

    console.log('✅ WhatsApp client state reset')

    return {
      success: true,
      message: 'WhatsApp client logged out and session cleared'
    }
  } catch (error) {
    console.error('Error logging out WhatsApp client:', error)
    return {
      success: false,
      message: 'Failed to logout WhatsApp client'
    }
  }
}

// Test WhatsApp Web.js connection
export async function testWhatsAppWebJsConnection(testPhoneNumber?: string): Promise<{
  success: boolean
  message: string
  messageId?: string
}> {
  try {
    const config = getWhatsAppConfig()
    const phoneNumber = testPhoneNumber || config.adminPhoneNumber

    const testMessage = `🧪 *Test Message - Betty Organic*

This is a test message from your Betty Organic WhatsApp Web.js integration.

Provider: WhatsApp Web.js
Time: ${new Date().toLocaleString()}

If you received this message, your WhatsApp integration is working correctly! ✅`

    const result = await sendWhatsAppWebJsMessage({
      phoneNumber,
      message: testMessage
    })

    if (result.success) {
      return {
        success: true,
        message: 'Test message sent successfully via WhatsApp Web.js',
        messageId: result.messageId
      }
    } else {
      return {
        success: false,
        message: `Test failed: ${result.error}`
      }
    }
  } catch (error) {
    console.error('WhatsApp Web.js test failed:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Test failed'
    }
  }
}