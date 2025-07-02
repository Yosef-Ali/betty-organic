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
    // Try to get browser executable path from the full puppeteer package
    let puppeteer;
    try {
      puppeteer = require('puppeteer');
      console.log('✅ Using full puppeteer package');
    } catch (err) {
      puppeteer = require('puppeteer-core');
      console.log('⚠️ Using puppeteer-core package');
    }

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
      console.log('ℹ️ WhatsApp client is already ready and connected')
      return {
        success: true,
        message: 'WhatsApp client is already initialized and ready'
      }
    }

    if (whatsappClient.isAuthenticating) {
      console.log('ℹ️ WhatsApp client is currently authenticating...')
      return {
        success: false,
        message: 'WhatsApp client is already authenticating. Please wait for QR code or connection to complete.',
        qrCode: whatsappClient.qrCode || undefined
      }
    }

    const config = getWhatsAppConfig()

    // Cleanup any existing client and browser processes
    if (whatsappClient.client) {
      try {
        console.log('🧹 Cleaning up existing client...')
        await whatsappClient.client.destroy()
        whatsappClient.client = null
      } catch (cleanupError) {
        console.warn('⚠️ Error during cleanup:', cleanupError)
      }
    }

    // Clean up any existing session locks more comprehensively
    const sessionPath = path.resolve(config.webJs.sessionPath || './whatsapp-session')
    const sessionDir = path.join(sessionPath, 'session-betty-organic-app')

    // Remove all lock-related files
    const lockFiles = ['SingletonLock', 'SingletonCookie', 'SingletonSocket', 'DevToolsActivePort', 'RunningChromeVersion']

    for (const lockFile of lockFiles) {
      const lockPath = path.join(sessionDir, lockFile)
      if (fs.existsSync(lockPath)) {
        try {
          console.log(`🔓 Removing ${lockFile}...`)
          const stats = fs.lstatSync(lockPath)
          if (stats.isSymbolicLink()) {
            fs.unlinkSync(lockPath) // Remove symlink
          } else {
            fs.unlinkSync(lockPath) // Remove regular file
          }
          console.log(`✅ ${lockFile} removed`)
        } catch (lockError) {
          console.warn(`⚠️ Could not remove ${lockFile}:`, lockError)
        }
      }
    }

    // Kill any lingering Chrome processes
    try {
      const { execSync } = require('child_process')
      const processes = execSync(`ps aux | grep "chrome.*betty-organic-app" | grep -v grep`, { encoding: 'utf8' })
      if (processes.trim()) {
        console.log('🔪 Killing existing Chrome processes...')
        const lines = processes.trim().split('\n')
        for (const line of lines) {
          const pid = line.trim().split(/\s+/)[1]
          if (pid && /^\d+$/.test(pid)) {
            try {
              execSync(`kill -9 ${pid}`)
              console.log(`✅ Killed Chrome process: ${pid}`)
            } catch (killError) {
              console.warn(`⚠️ Could not kill process ${pid}:`, killError)
            }
          }
        }
      }
    } catch (psError) {
      // No processes found - this is fine
      console.log('✅ No existing Chrome processes to clean up')
    }

    // Give the system a moment to fully clean up
    await new Promise(resolve => setTimeout(resolve, 2000))

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
    let puppeteer;
    try {
      puppeteer = require('puppeteer');
      console.log('✅ Using full puppeteer package for WhatsApp client');
    } catch (err) {
      puppeteer = require('puppeteer-core');
      console.log('⚠️ Using puppeteer-core package for WhatsApp client');
    }

    // For local development on macOS, use non-headless mode for better compatibility
    const isLocalDev = process.env.NODE_ENV !== 'production'
    const isMacOS = process.platform === 'darwin'

    const puppeteerConfig = {
      headless: true, // Use headless mode for better compatibility in production
      timeout: 120000, // 120 second timeout for better compatibility
      executablePath: puppeteer.executablePath(), // Use the correct Puppeteer browser path
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=IsolateOrigins',
        '--disable-site-isolation-trials',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-accelerated-2d-canvas',
        '--window-size=1920,1080',
        '--disable-hang-monitor',
        '--disable-prompt-on-repost',
        '--disable-sync',
        '--metrics-recording-only',
        '--no-crash-upload',
        '--disable-component-update'
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
      executablePath: puppeteerConfig.executablePath.includes('Puppeteer') ? 'Bundled Puppeteer Chrome' : puppeteerConfig.executablePath,
      browserMode: puppeteerConfig.headless ? 'Headless (QR in settings)' : 'Visible Browser (for debugging)'
    })

    if (puppeteerConfig.headless) {
      console.log('📱 Running in headless mode - QR code will appear in your settings page')
      console.log('🔍 The browser runs in the background, no window will open')
    } else {
      console.log('🖥️ Running in visible mode - Chrome window will open for better WhatsApp compatibility')
      console.log('📱 You can see WhatsApp Web loading in the browser window')
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
        },
        qrMaxRetries: 10, // Increased retries for more chances to scan
        authTimeoutMs: 120000, // Increased to 2 minutes for more time to scan
        takeoverOnConflict: true,
        takeoverTimeoutMs: 0,
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      })
      console.log('✅ WhatsApp client created successfully')

      // Add a small delay to allow Chrome to fully start
      await new Promise(resolve => setTimeout(resolve, 2000))

    } catch (clientError) {
      console.error('❌ Failed to create WhatsApp client:', clientError)
      throw new Error(`Failed to create WhatsApp client: ${clientError instanceof Error ? clientError.message : 'Unknown error'}`)
    }

    // Set up event handlers
    whatsappClient.client.on('qr', async (qr) => {
      // Only accept new QR codes if we're not already in the authentication process
      if (whatsappClient.qrCode && whatsappClient.isAuthenticating) {
        console.log('📱 Ignoring new QR code - authentication already in progress')
        return
      }

      console.log('📱 QR Code received, scan with WhatsApp mobile app')
      console.log('🔍 QR data type:', typeof qr)
      console.log('🔍 QR data length:', qr.length)
      console.log('🔍 QR data preview:', qr.substring(0, 50) + '...')

      // Convert QR string data to base64 image
      try {
        const qrcode = require('qrcode')
        const dataUrl = await qrcode.toDataURL(qr, {
          width: 256,
          margin: 2,
          errorCorrectionLevel: 'M'
        })

        whatsappClient.qrCode = dataUrl
        console.log('✅ QR Code converted to base64 image')
        console.log('🔍 Data URL type:', typeof dataUrl)
        console.log('🔍 Data URL starts with:', dataUrl.substring(0, 50))
      } catch (err) {
        console.error('❌ Failed to convert QR code:', err)
        // Try to store raw QR data as fallback
        whatsappClient.qrCode = qr
      }
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

    // Add timeout handler for stuck authentication
    let authTimeout: NodeJS.Timeout | null = null

    whatsappClient.client.on('authenticated', () => {
      console.log('🔐 WhatsApp client authenticated successfully')
      console.log('✅ QR Code was scanned and accepted by WhatsApp')
      console.log('⏳ Waiting for WhatsApp Web to fully load...')
      whatsappClient.qrCode = null // Clear QR code after successful authentication
      whatsappClient.isAuthenticating = true // Keep authenticating state until ready

      // Show progress message
      console.log('📱 Please wait while WhatsApp Web loads completely...')
      console.log('💡 Do not scan any new QR codes - connection is in progress!')

      // Set a timeout to handle stuck authentication
      authTimeout = setTimeout(() => {
        if (whatsappClient.isAuthenticating && !whatsappClient.isReady) {
          console.log('⏰ Authentication seems stuck, attempting restart...')
          whatsappClient.client?.destroy().catch(console.error)
          whatsappClient.isAuthenticating = false
          whatsappClient.isReady = false

          // Restart initialization after a short delay
          setTimeout(() => {
            initializeWhatsAppClient()
          }, 3000)
        }
      }, 30000) // 30 second timeout
    })

    whatsappClient.client.on('ready', () => {
      console.log('✅ WhatsApp Web.js client is ready!')
      if (authTimeout) {
        clearTimeout(authTimeout)
        authTimeout = null
      }
      whatsappClient.isReady = true
      whatsappClient.isAuthenticating = false
      whatsappClient.qrCode = null
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

    // Handle browser disconnect/crash
    whatsappClient.client.on('browser_disconnected', () => {
      console.log('🔌 Browser disconnected from WhatsApp Web')
      console.log('🔄 Will attempt to reconnect...')
      whatsappClient.isReady = false
      whatsappClient.isAuthenticating = false
    })

    // Initialize the client with faster startup
    try {
      console.log('🚀 Starting WhatsApp client initialization...')

      // Start initialization immediately without waiting
      whatsappClient.client.initialize().then(() => {
        console.log('✅ WhatsApp client initialization completed')
      }).catch((error) => {
        console.error('❌ WhatsApp client initialization error:', error)
        whatsappClient.isAuthenticating = false
      })

      console.log('✅ WhatsApp client initialization started successfully')

    } catch (initError) {
      console.error('❌ Failed to initialize WhatsApp client:', initError)
      whatsappClient.isAuthenticating = false

      return {
        success: false,
        message: 'WhatsApp client initialization failed - browser automation issue',
        error: 'Unable to start WhatsApp Web automation. This is usually due to browser compatibility issues.'
      }
    }

    // Return immediately - QR code will be available via status endpoint
    return {
      success: true,
      message: 'WhatsApp client initialization started. QR code will be available shortly.'
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
    // Check if client exists and is ready
    if (!whatsappClient.client || !whatsappClient.isReady) {
      console.log('⚠️ WhatsApp client not ready. Current state:', {
        clientExists: !!whatsappClient.client,
        isReady: whatsappClient.isReady,
        isAuthenticating: whatsappClient.isAuthenticating
      })

      // If client is still authenticating, wait for it to complete
      if (whatsappClient.isAuthenticating) {
        console.log('⏳ Client is still authenticating, waiting...')
        let authRetries = 0
        while (whatsappClient.isAuthenticating && authRetries < 30) { // Wait up to 30 seconds for auth
          await new Promise(resolve => setTimeout(resolve, 1000))
          authRetries++
          if (authRetries % 5 === 0) { // Log every 5 seconds
            console.log(`⏳ Still waiting for authentication... (${authRetries}/30 seconds)`)
          }
        }
      }

      // If still not ready after auth wait, try to initialize
      if (!whatsappClient.isReady) {
        console.log('🔄 Attempting to initialize WhatsApp client...')
        const initResult = await initializeWhatsAppClient()
        if (!initResult.success) {
          return {
            success: false,
            error: 'WhatsApp client initialization failed: ' + initResult.message
          }
        }
      }

      // Wait for client to be ready with extended timeout
      console.log('⏳ Waiting for WhatsApp client to be ready...')
      let retries = 0
      while (!whatsappClient.isReady && retries < 60) { // Increased to 60 seconds
        await new Promise(resolve => setTimeout(resolve, 1000))
        retries++

        // Log progress every 10 seconds
        if (retries % 10 === 0) {
          console.log(`⏳ Still waiting for client to be ready... (${retries}/60 seconds)`)
          console.log('📊 Current client state:', {
            clientExists: !!whatsappClient.client,
            isReady: whatsappClient.isReady,
            isAuthenticating: whatsappClient.isAuthenticating
          })
        }
      }

      if (!whatsappClient.isReady) {
        console.error('❌ WhatsApp client failed to become ready after 60 seconds')
        return {
          success: false,
          error: `WhatsApp client not ready after 60 seconds. Current state: Ready=${whatsappClient.isReady}, Authenticating=${whatsappClient.isAuthenticating}, Client=${!!whatsappClient.client}`
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
    console.log('📋 Message parameters:', {
      hasMessage: !!message,
      hasMediaPath: !!mediaPath,
      mediaPathType: mediaPath ? (mediaPath.startsWith('http') ? 'URL' : 'File Path') : 'None',
      mediaPath: mediaPath ? mediaPath.substring(0, 100) + '...' : 'None'
    })

    let messageResult

    if (mediaPath) {
      // Check if mediaPath is a URL or file path
      if (mediaPath.startsWith('http://') || mediaPath.startsWith('https://')) {
        // Handle URL - download and send
        console.log('📎 Sending media message from URL:', mediaPath)
        console.log('🔍 Testing URL accessibility...')
        try {
          const response = await fetch(mediaPath)
          console.log('📥 URL fetch response:', {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok,
            headers: Object.fromEntries(response.headers.entries())
          })

          if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`)
          }

          const arrayBuffer = await response.arrayBuffer()
          const buffer = Buffer.from(arrayBuffer)
          const base64 = buffer.toString('base64')

          console.log('📊 Image download stats:', {
            arrayBufferSize: arrayBuffer.byteLength,
            bufferSize: buffer.length,
            base64Length: base64.length
          })

          // Determine mimetype from URL or default to PNG
          let mimetype = 'image/png'
          if (mediaPath.includes('.jpg') || mediaPath.includes('.jpeg')) {
            mimetype = 'image/jpeg'
          } else if (mediaPath.includes('.gif')) {
            mimetype = 'image/gif'
          }

          const media = new MessageMedia(mimetype, base64)

          messageResult = await whatsappClient.client!.sendMessage(chatId, media, {
            caption: mediaCaption || message || ''
          })
        } catch (urlError) {
          console.error('❌ Failed to download media from URL:', urlError)
          console.log('🔄 Attempting to send text message instead of failing completely...')

          // If we have a message to send, send it as text instead of failing
          if (message) {
            console.log('💬 Sending text message as fallback')
            messageResult = await whatsappClient.client!.sendMessage(chatId, message)
          } else {
            return {
              success: false,
              error: `Failed to download media from URL: ${urlError instanceof Error ? urlError.message : 'Unknown error'}`
            }
          }
        }
      } else if (fs.existsSync(mediaPath)) {
        // Handle file path
        console.log('📎 Sending media message with file:', mediaPath)
        const media = MessageMedia.fromFilePath(mediaPath)

        messageResult = await whatsappClient.client!.sendMessage(chatId, media, {
          caption: mediaCaption || message || ''
        })
      } else {
        console.error('❌ Media file not found:', mediaPath)
        return {
          success: false,
          error: `Media file not found: ${mediaPath}`
        }
      }
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

    // If client is null or connection lost, mark as not ready
    if (error instanceof Error && (
      error.message.includes('null') ||
      error.message.includes('evaluate') ||
      error.message.includes('browser')
    )) {
      console.log('🔄 Browser connection lost, marking client as not ready')
      whatsappClient.isReady = false
      whatsappClient.isAuthenticating = false
    }

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