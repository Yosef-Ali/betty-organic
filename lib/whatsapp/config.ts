import crypto from 'crypto'

// WhatsApp API Provider types
export type WhatsAppProvider = 'manual' | 'cloud-api' | 'whatsapp-web-js' | 'twilio' | 'baileys'

// WhatsApp configuration management
export interface WhatsAppConfig {
  // Core settings
  adminPhoneNumber: string
  enableOrderNotifications: boolean
  enableRealTimeNotifications: boolean
  notificationMessage: string
  provider: WhatsAppProvider

  // WhatsApp Web.js settings
  webJs: {
    sessionPath?: string
    puppeteerOptions?: {
      headless?: boolean
      args?: string[]
    }
    authTimeout?: number
    restartOnAuthFail?: boolean
  }

  // WhatsApp Cloud API settings
  cloudApi: {
    accessToken?: string
    phoneNumberId?: string
    version?: string
    baseUrl?: string
    webhookVerifyToken?: string
    appSecret?: string
  }
}

// Default configuration
export const defaultWhatsAppConfig: WhatsAppConfig = {
  adminPhoneNumber: process.env.ADMIN_WHATSAPP_NUMBER || '+251912345678',
  enableOrderNotifications: true,
  enableRealTimeNotifications: true,
  notificationMessage: 'New order received from Betty Organic App! Order #{display_id}',
  provider: (process.env.WHATSAPP_API_PROVIDER as WhatsAppProvider) || (process.env.VERCEL ? 'manual' : 'whatsapp-web-js'),

  webJs: {
    sessionPath: process.env.WHATSAPP_SESSION_PATH || './whatsapp-session',
    puppeteerOptions: {
      headless: process.env.NODE_ENV === 'production',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    },
    authTimeout: 60000, // 60 seconds
    restartOnAuthFail: true
  },

  cloudApi: {
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    version: 'v21.0',
    baseUrl: 'https://graph.facebook.com',
    webhookVerifyToken: process.env.WEBHOOK_VERIFY_TOKEN,
    appSecret: process.env.WHATSAPP_APP_SECRET
  }
}

// Configuration validation
export interface ConfigValidation {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export function validateWhatsAppConfig(config: WhatsAppConfig): ConfigValidation {
  const errors: string[] = []
  const warnings: string[] = []

  // Basic validations
  if (!config.adminPhoneNumber) {
    errors.push('Admin phone number is required')
  } else if (!/^\+[1-9]\d{1,14}$/.test(config.adminPhoneNumber)) {
    errors.push('Admin phone number must be in international format (e.g., +251912345678)')
  }

  // WhatsApp Web.js validations
  if (!config.webJs.sessionPath) {
    warnings.push('Session path not configured, using default')
  }

  if (config.webJs.authTimeout && config.webJs.authTimeout < 30000) {
    warnings.push('Auth timeout is very short, consider increasing it')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

// Get current configuration
export function getWhatsAppConfig(): WhatsAppConfig {
  return defaultWhatsAppConfig
}

// Webhook signature verification for security
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  appSecret: string
): boolean {
  if (!appSecret || !signature) {
    return false
  }

  try {
    // Remove 'sha1=' or 'sha256=' prefix if present
    const cleanSignature = signature.replace(/^sha\d+=/, '')

    // Generate expected signature
    const expectedSignature = crypto
      .createHmac('sha1', appSecret)
      .update(payload, 'utf8')
      .digest('hex')

    // Use timingSafeEqual to prevent timing attacks
    const signatureBuffer = Buffer.from(cleanSignature, 'hex')
    const expectedBuffer = Buffer.from(expectedSignature, 'hex')

    // Ensure buffers have the same length
    if (signatureBuffer.length !== expectedBuffer.length) {
      return false
    }

    return crypto.timingSafeEqual(
      new Uint8Array(signatureBuffer),
      new Uint8Array(expectedBuffer)
    )
  } catch (error) {
    console.error('Webhook signature verification error:', error)
    return false
  }
}

// Check if configuration allows automatic sending
export function canSendAutomatically(config: WhatsAppConfig): boolean {
  const validation = validateWhatsAppConfig(config)
  return validation.isValid
}

// Get provider display name
export function getProviderDisplayName(): string {
  return 'WhatsApp Web.js'
}

// Configuration diagnostics
export interface ConfigDiagnostics {
  config: WhatsAppConfig
  validation: ConfigValidation
  capabilities: {
    canSendMessages: boolean
    canReceiveWebhooks: boolean
    hasSecureWebhooks: boolean
    supportedFeatures: string[]
  }
  recommendations: string[]
}

export function diagnoseConfiguration(): ConfigDiagnostics {
  const config = getWhatsAppConfig()
  const validation = validateWhatsAppConfig(config)

  const capabilities = {
    canSendMessages: canSendAutomatically(config),
    canReceiveWebhooks: true, // WhatsApp Web.js supports incoming messages
    hasSecureWebhooks: true, // Built-in security with WhatsApp Web
    supportedFeatures: getSupportedFeatures(config)
  }

  const recommendations = generateRecommendations(config, validation)

  return {
    config,
    validation,
    capabilities,
    recommendations
  }
}

function getSupportedFeatures(config: WhatsAppConfig): string[] {
  return [
    'Automatic message sending',
    'Message delivery status',
    'Incoming message handling',
    'Media messages (images, documents, audio)',
    'Group messaging',
    'Message reactions and replies',
    'Contact and location sharing',
    'Custom message templates',
    'QR code authentication',
    'Multi-device support'
  ]
}

function generateRecommendations(config: WhatsAppConfig, validation: ConfigValidation): string[] {
  const recommendations: string[] = []

  if (process.env.NODE_ENV === 'production' && config.webJs.puppeteerOptions?.headless === false) {
    recommendations.push('Enable headless mode for production deployment')
  }

  if (!config.webJs.sessionPath || config.webJs.sessionPath === './whatsapp-session') {
    recommendations.push('Consider using an absolute path for session storage in production')
  }

  if (validation.warnings.length > 0) {
    recommendations.push(...validation.warnings.map(w => `Address warning: ${w}`))
  }

  recommendations.push('Ensure your server has sufficient resources for browser automation')
  recommendations.push('Regularly backup your WhatsApp session data')

  return recommendations
}