import crypto from 'crypto'

// Unified WhatsApp configuration management
export interface WhatsAppConfig {
  // Core settings
  adminPhoneNumber: string
  enableOrderNotifications: boolean
  enableRealTimeNotifications: boolean
  notificationMessage: string
  
  // API Provider settings
  apiProvider: 'cloud-api' | 'twilio' | 'whatsapp-web-js' | 'baileys' | 'manual'
  
  // Cloud API credentials
  cloudApi: {
    accessToken?: string
    phoneNumberId?: string
    webhookVerifyToken?: string
    appSecret?: string // For webhook signature verification
    businessAccountId?: string
  }
  
  // Twilio credentials  
  twilio: {
    accountSid?: string
    authToken?: string
    whatsappNumber?: string
  }
  
  // Self-hosted service URLs
  services: {
    webJsUrl?: string
    baileysUrl?: string
  }
}

// Default configuration
export const defaultWhatsAppConfig: WhatsAppConfig = {
  adminPhoneNumber: process.env.ADMIN_WHATSAPP_NUMBER || '+251912345678',
  enableOrderNotifications: true,
  enableRealTimeNotifications: true,
  notificationMessage: 'New order received from Betty Organic App! Order #{display_id}',
  apiProvider: (process.env.WHATSAPP_API_PROVIDER as any) || 'manual',
  
  cloudApi: {
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    webhookVerifyToken: process.env.WEBHOOK_VERIFY_TOKEN,
    appSecret: process.env.WHATSAPP_APP_SECRET,
    businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID
  },
  
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    whatsappNumber: process.env.TWILIO_WHATSAPP_NUMBER
  },
  
  services: {
    webJsUrl: process.env.WHATSAPP_WEBJS_SERVICE_URL || 'http://localhost:3001',
    baileysUrl: process.env.WHATSAPP_BAILEYS_SERVICE_URL || 'http://localhost:3002'
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

  // Provider-specific validations
  switch (config.apiProvider) {
    case 'cloud-api':
      if (!config.cloudApi.accessToken) {
        errors.push('WhatsApp Cloud API access token is required')
      } else if (config.cloudApi.accessToken.startsWith('EAA') && config.cloudApi.accessToken.length < 200) {
        warnings.push('Access token appears to be temporary. Consider using a permanent token for production.')
      }
      
      if (!config.cloudApi.phoneNumberId) {
        errors.push('WhatsApp Phone Number ID is required for Cloud API')
      }
      
      if (!config.cloudApi.webhookVerifyToken) {
        warnings.push('Webhook verify token not set. Webhooks will not work.')
      }
      
      if (!config.cloudApi.appSecret) {
        warnings.push('App secret not set. Webhook security validation disabled.')
      }
      break

    case 'twilio':
      if (!config.twilio.accountSid || !config.twilio.authToken) {
        errors.push('Twilio Account SID and Auth Token are required')
      }
      if (!config.twilio.whatsappNumber) {
        warnings.push('Twilio WhatsApp number not configured')
      }
      break

    case 'whatsapp-web-js':
      if (!config.services.webJsUrl) {
        errors.push('WhatsApp Web.js service URL is required')
      }
      break

    case 'baileys':
      if (!config.services.baileysUrl) {
        errors.push('Baileys service URL is required')
      }
      break

    case 'manual':
      // Manual mode requires no additional configuration
      break

    default:
      errors.push(`Unknown API provider: ${config.apiProvider}`)
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
    
    return crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
  } catch (error) {
    console.error('Webhook signature verification error:', error)
    return false
  }
}

// Check if configuration allows automatic sending
export function canSendAutomatically(config: WhatsAppConfig): boolean {
  if (config.apiProvider === 'manual') {
    return false
  }

  const validation = validateWhatsAppConfig(config)
  return validation.isValid
}

// Get provider display name
export function getProviderDisplayName(provider: string): string {
  const names: Record<string, string> = {
    'cloud-api': 'WhatsApp Cloud API (Meta)',
    'twilio': 'Twilio WhatsApp API',
    'whatsapp-web-js': 'WhatsApp Web.js',
    'baileys': 'Baileys',
    'manual': 'Manual (Free)'
  }
  
  return names[provider] || provider
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
    canReceiveWebhooks: config.apiProvider === 'cloud-api' && !!config.cloudApi.webhookVerifyToken,
    hasSecureWebhooks: !!config.cloudApi.appSecret,
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
  const features: string[] = []
  
  if (config.apiProvider !== 'manual') {
    features.push('Automatic message sending')
  }
  
  if (config.apiProvider === 'cloud-api') {
    features.push('Message delivery status')
    features.push('Incoming message handling')
    features.push('Media messages (with full setup)')
  }
  
  features.push('Manual WhatsApp URL generation')
  features.push('Custom message templates')
  
  return features
}

function generateRecommendations(config: WhatsAppConfig, validation: ConfigValidation): string[] {
  const recommendations: string[] = []
  
  if (config.apiProvider === 'cloud-api') {
    if (!config.cloudApi.appSecret) {
      recommendations.push('Add WHATSAPP_APP_SECRET for secure webhook validation')
    }
    
    if (config.cloudApi.accessToken?.startsWith('EAA') && config.cloudApi.accessToken.length < 200) {
      recommendations.push('Replace temporary access token with permanent token for production use')
    }
    
    if (!config.cloudApi.businessAccountId) {
      recommendations.push('Add WHATSAPP_BUSINESS_ACCOUNT_ID for enhanced features')
    }
  }
  
  if (config.apiProvider === 'manual' && validation.isValid) {
    recommendations.push('Consider setting up Cloud API for automatic message sending')
  }
  
  if (validation.warnings.length > 0) {
    recommendations.push(...validation.warnings.map(w => `Address warning: ${w}`))
  }
  
  return recommendations
}