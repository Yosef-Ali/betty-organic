/**
 * @jest-environment node
 */

import { 
  sendAdminWhatsAppNotification, 
  sendCustomerInvoiceWhatsApp as sendCustomerReceiptWhatsApp,
  testWhatsAppConnection 
} from '@/app/actions/whatsappActions'

// Mock the config module
jest.mock('@/lib/whatsapp/config', () => ({
  getWhatsAppConfig: jest.fn(() => ({
    adminPhoneNumber: '+251912345678',
    enableOrderNotifications: true,
    enableRealTimeNotifications: true,
    notificationMessage: 'New order #{display_id}',
    apiProvider: 'manual',
    cloudApi: {
      accessToken: 'test_token',
      phoneNumberId: '123456789'
    },
    twilio: {},
    services: {}
  })),
  validateWhatsAppConfig: jest.fn(() => ({
    isValid: true,
    errors: [],
    warnings: []
  })),
  canSendAutomatically: jest.fn(() => false), // Manual mode
  diagnoseConfiguration: jest.fn(() => ({
    config: {},
    validation: { isValid: true, errors: [], warnings: [] },
    capabilities: {
      canSendMessages: false,
      canReceiveWebhooks: false,
      hasSecureWebhooks: false,
      supportedFeatures: ['Manual WhatsApp URL generation']
    },
    recommendations: []
  }))
}))

// Mock fetch for API calls
global.fetch = jest.fn()

describe('WhatsApp Actions', () => {
  const mockOrderDetails = {
    id: '123',
    display_id: 'ORD-001',
    items: [
      {
        name: 'Organic Apples',
        grams: 1000,
        price: 50.00,
        unit_price: 50.00
      },
      {
        name: 'Fresh Carrots',
        grams: 500,
        price: 25.00,
        unit_price: 50.00
      }
    ],
    total: 75.00,
    customer_name: 'John Doe',
    customer_phone: '+251911223344',
    delivery_address: '123 Main St, Addis Ababa',
    customer_email: 'john@example.com',
    user_id: 'user123',
    created_at: '2024-01-01T10:00:00Z'
  }

  const mockReceiptData = {
    customerPhone: '+251911223344',
    customerName: 'John Doe',
    orderId: 'ORD-001',
    items: [
      {
        name: 'Organic Apples',
        quantity: 1,
        price: 50.00
      }
    ],
    total: 50.00
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('sendAdminWhatsAppNotification', () => {
    it('should generate WhatsApp URL for admin notification in manual mode', async () => {
      const result = await sendAdminWhatsAppNotification(mockOrderDetails)

      expect(result.success).toBe(true)
      expect(result.whatsappUrl).toContain('wa.me/251912345678')
      expect(result.whatsappUrl).toContain('ORD-001')
      expect(result.method).toBe('url')
      expect(result.data.adminPhone).toBe('+251912345678')
    })

    it('should include all order items in the message', async () => {
      const result = await sendAdminWhatsAppNotification(mockOrderDetails)

      expect(result.data.message).toContain('Organic Apples')
      expect(result.data.message).toContain('Fresh Carrots')
      expect(result.data.message).toContain('ETB 75.00')
      expect(result.data.message).toContain('John Doe')
      expect(result.data.message).toContain('+251911223344')
    })

    it('should format phone numbers correctly in URL', async () => {
      const result = await sendAdminWhatsAppNotification(mockOrderDetails)

      // Should remove + from phone number in URL
      expect(result.whatsappUrl).toContain('wa.me/251912345678')
      expect(result.whatsappUrl).not.toContain('wa.me/+251912345678')
    })

    it('should handle missing order data gracefully', async () => {
      const incompleteOrder = {
        ...mockOrderDetails,
        customer_name: '',
        items: []
      }

      const result = await sendAdminWhatsAppNotification(incompleteOrder)

      expect(result.success).toBe(true) // Should still succeed with URL generation
      expect(result.whatsappUrl).toBeDefined()
    })
  })

  describe('sendCustomerReceiptWhatsApp', () => {
    it('should generate WhatsApp URL for customer receipt in manual mode', async () => {
      const result = await sendCustomerReceiptWhatsApp(mockReceiptData)

      expect(result.success).toBe(true)
      expect(result.whatsappUrl).toContain('wa.me/251911223344')
      expect(result.whatsappUrl).toContain('ORD-001')
      expect(result.method).toBe('url')
    })

    it('should include receipt details in message', async () => {
      const result = await sendCustomerReceiptWhatsApp(mockReceiptData)

      expect(result.data.message).toContain('John Doe')
      expect(result.data.message).toContain('ORD-001')
      expect(result.data.message).toContain('Organic Apples')
      expect(result.data.message).toContain('ETB 50.00')
      expect(result.data.message).toContain('Thank you for choosing Betty Organic')
    })

    it('should clean phone number formatting', async () => {
      const receiptWithFormattedPhone = {
        ...mockReceiptData,
        customerPhone: '+251 (911) 223-344'
      }

      const result = await sendCustomerReceiptWhatsApp(receiptWithFormattedPhone)

      expect(result.success).toBe(true)
      expect(result.whatsappUrl).toContain('wa.me/251911223344')
    })

    it('should calculate item weights correctly', async () => {
      const receiptWithMultipleItems = {
        ...mockReceiptData,
        items: [
          { name: 'Item 1', quantity: 1.5, price: 30 }, // 1.5kg = 1500g
          { name: 'Item 2', quantity: 0.5, price: 20 }  // 0.5kg = 500g
        ]
      }

      const result = await sendCustomerReceiptWhatsApp(receiptWithMultipleItems)

      expect(result.data.message).toContain('1500g')
      expect(result.data.message).toContain('500g')
    })
  })

  describe('testWhatsAppConnection', () => {
    it('should test connection and return success for manual mode', async () => {
      const result = await testWhatsAppConnection()

      expect(result.success).toBe(false) // Manual mode can't auto-send
      expect(result.provider).toBe('manual')
      expect(result.error).toContain('Automatic sending not available')
    })

    it('should handle missing settings gracefully', async () => {
      // Mock getWhatsAppSettings to return null
      jest.doMock('@/app/actions/whatsappActions', () => ({
        ...jest.requireActual('@/app/actions/whatsappActions'),
        getWhatsAppSettings: jest.fn(() => Promise.resolve(null))
      }))

      const result = await testWhatsAppConnection()

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  describe('Phone Number Formatting', () => {
    it('should handle various phone number formats consistently', async () => {
      const testNumbers = [
        '+251 911 223 344',
        '+251-911-223-344',
        '+251(911)223-344',
        '251911223344',
        '+251911223344'
      ]

      for (const phoneNumber of testNumbers) {
        const orderWithFormattedPhone = {
          ...mockOrderDetails,
          customer_phone: phoneNumber
        }

        const result = await sendAdminWhatsAppNotification(orderWithFormattedPhone)
        
        expect(result.success).toBe(true)
        // Message should contain the original phone number format
        expect(result.data.message).toContain(phoneNumber)
      }
    })
  })

  describe('Message Content Validation', () => {
    it('should generate valid WhatsApp URLs', async () => {
      const result = await sendAdminWhatsAppNotification(mockOrderDetails)

      expect(result.whatsappUrl).toMatch(/^https:\/\/wa\.me\/\d+\?text=/)
      
      // URL should be properly encoded
      const url = new URL(result.whatsappUrl)
      expect(url.searchParams.get('text')).toBeDefined()
    })

    it('should handle special characters in order data', async () => {
      const orderWithSpecialChars = {
        ...mockOrderDetails,
        customer_name: 'José & María',
        delivery_address: '123 Main St. #5, Addis Ababa'
      }

      const result = await sendAdminWhatsAppNotification(orderWithSpecialChars)

      expect(result.success).toBe(true)
      expect(result.whatsappUrl).toBeDefined()
      
      // Should be properly URL encoded
      const decodedMessage = decodeURIComponent(result.whatsappUrl.split('text=')[1])
      expect(decodedMessage).toContain('José & María')
    })

    it('should include current timestamp', async () => {
      const result = await sendAdminWhatsAppNotification(mockOrderDetails)

      // Should include order time in the message
      expect(result.data.message).toContain('Order Time:')
    })
  })
})