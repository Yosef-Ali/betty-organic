import { 
  validateWhatsAppConfig, 
  verifyWebhookSignature, 
  canSendAutomatically,
  getProviderDisplayName,
  diagnoseConfiguration,
  type WhatsAppConfig 
} from '@/lib/whatsapp/config'

describe('WhatsApp Configuration', () => {
  const mockValidConfig: WhatsAppConfig = {
    adminPhoneNumber: '+251912345678',
    enableOrderNotifications: true,
    enableRealTimeNotifications: true,
    notificationMessage: 'New order #{display_id}',
    apiProvider: 'cloud-api',
    cloudApi: {
      accessToken: 'EAA' + 'x'.repeat(200), // Mock permanent token
      phoneNumberId: '123456789',
      webhookVerifyToken: 'verify_token_123',
      appSecret: 'app_secret_123'
    },
    twilio: {},
    services: {}
  }

  const mockInvalidConfig: WhatsAppConfig = {
    adminPhoneNumber: '251912345678', // Missing +
    enableOrderNotifications: true,
    enableRealTimeNotifications: true,
    notificationMessage: '',
    apiProvider: 'cloud-api',
    cloudApi: {
      // Missing required fields
    },
    twilio: {},
    services: {}
  }

  describe('validateWhatsAppConfig', () => {
    it('should validate a correct cloud-api configuration', () => {
      const result = validateWhatsAppConfig(mockValidConfig)
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should fail validation for invalid phone number', () => {
      const result = validateWhatsAppConfig(mockInvalidConfig)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Admin phone number must be in international format (e.g., +251912345678)')
    })

    it('should fail validation for missing cloud-api credentials', () => {
      const result = validateWhatsAppConfig(mockInvalidConfig)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('WhatsApp Cloud API access token is required')
      expect(result.errors).toContain('WhatsApp Phone Number ID is required for Cloud API')
    })

    it('should warn about temporary access tokens', () => {
      const configWithTempToken = {
        ...mockValidConfig,
        cloudApi: {
          ...mockValidConfig.cloudApi,
          accessToken: 'EAAshort' // Short token
        }
      }
      
      const result = validateWhatsAppConfig(configWithTempToken)
      
      expect(result.warnings).toContain('Access token appears to be temporary. Consider using a permanent token for production.')
    })

    it('should validate manual provider correctly', () => {
      const manualConfig = {
        ...mockValidConfig,
        apiProvider: 'manual' as const
      }
      
      const result = validateWhatsAppConfig(manualConfig)
      
      expect(result.isValid).toBe(true)
    })

    it('should validate twilio provider correctly', () => {
      const twilioConfig = {
        ...mockValidConfig,
        apiProvider: 'twilio' as const,
        twilio: {
          accountSid: 'AC123',
          authToken: 'auth123'
        }
      }
      
      const result = validateWhatsAppConfig(twilioConfig)
      
      expect(result.isValid).toBe(true)
    })

    it('should fail twilio validation without credentials', () => {
      const twilioConfig = {
        ...mockValidConfig,
        apiProvider: 'twilio' as const,
        twilio: {}
      }
      
      const result = validateWhatsAppConfig(twilioConfig)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Twilio Account SID and Auth Token are required')
    })
  })

  describe('verifyWebhookSignature', () => {
    const payload = '{"test": "data"}'
    const appSecret = 'test_secret'
    
    it('should verify correct signature', () => {
      // Generate expected signature
      const crypto = require('crypto')
      const expectedSignature = crypto
        .createHmac('sha1', appSecret)
        .update(payload, 'utf8')
        .digest('hex')
      
      const result = verifyWebhookSignature(payload, `sha1=${expectedSignature}`, appSecret)
      
      expect(result).toBe(true)
    })

    it('should reject incorrect signature', () => {
      const result = verifyWebhookSignature(payload, 'sha1=invalid_signature', appSecret)
      
      expect(result).toBe(false)
    })

    it('should reject when signature is missing', () => {
      const result = verifyWebhookSignature(payload, '', appSecret)
      
      expect(result).toBe(false)
    })

    it('should reject when app secret is missing', () => {
      const result = verifyWebhookSignature(payload, 'sha1=test', '')
      
      expect(result).toBe(false)
    })
  })

  describe('canSendAutomatically', () => {
    it('should return true for valid cloud-api config', () => {
      const result = canSendAutomatically(mockValidConfig)
      
      expect(result).toBe(true)
    })

    it('should return false for manual provider', () => {
      const manualConfig = {
        ...mockValidConfig,
        apiProvider: 'manual' as const
      }
      
      const result = canSendAutomatically(manualConfig)
      
      expect(result).toBe(false)
    })

    it('should return false for invalid config', () => {
      const result = canSendAutomatically(mockInvalidConfig)
      
      expect(result).toBe(false)
    })
  })

  describe('getProviderDisplayName', () => {
    it('should return correct display names', () => {
      expect(getProviderDisplayName('cloud-api')).toBe('WhatsApp Cloud API (Meta)')
      expect(getProviderDisplayName('twilio')).toBe('Twilio WhatsApp API')
      expect(getProviderDisplayName('manual')).toBe('Manual (Free)')
      expect(getProviderDisplayName('unknown')).toBe('unknown')
    })
  })

  describe('diagnoseConfiguration', () => {
    it('should provide comprehensive diagnostics', () => {
      // Mock the environment to return our test config
      jest.doMock('@/lib/whatsapp/config', () => ({
        ...jest.requireActual('@/lib/whatsapp/config'),
        getWhatsAppConfig: () => mockValidConfig
      }))
      
      const diagnostics = diagnoseConfiguration()
      
      expect(diagnostics).toHaveProperty('config')
      expect(diagnostics).toHaveProperty('validation')
      expect(diagnostics).toHaveProperty('capabilities')
      expect(diagnostics).toHaveProperty('recommendations')
      
      expect(diagnostics.capabilities).toHaveProperty('canSendMessages')
      expect(diagnostics.capabilities).toHaveProperty('canReceiveWebhooks')
      expect(diagnostics.capabilities).toHaveProperty('hasSecureWebhooks')
      expect(diagnostics.capabilities).toHaveProperty('supportedFeatures')
    })
  })
})