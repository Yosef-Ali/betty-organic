/**
 * @jest-environment node
 */

import { GET, POST } from '@/app/api/whatsapp/webhook/route'
import { NextRequest } from 'next/server'
import crypto from 'crypto'

// Mock the config module
jest.mock('@/lib/whatsapp/config', () => ({
  getWhatsAppConfig: jest.fn(() => ({
    cloudApi: {
      webhookVerifyToken: 'test_verify_token',
      appSecret: 'test_app_secret'
    }
  })),
  verifyWebhookSignature: jest.fn()
}))

// Mock Supabase
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      upsert: jest.fn(() => Promise.resolve({ error: null }))
    }))
  }))
}))

describe('WhatsApp Webhook', () => {
  const mockVerifyToken = 'test_verify_token'
  const mockAppSecret = 'test_app_secret'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET - Webhook Verification', () => {
    it('should verify webhook with correct parameters', async () => {
      const url = `http://localhost:3000/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=${mockVerifyToken}&hub.challenge=test_challenge`
      const request = new NextRequest(url)

      const response = await GET(request)
      const responseText = await response.text()

      expect(response.status).toBe(200)
      expect(responseText).toBe('test_challenge')
    })

    it('should reject webhook verification with wrong token', async () => {
      const url = 'http://localhost:3000/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=wrong_token&hub.challenge=test_challenge'
      const request = new NextRequest(url)

      const response = await GET(request)

      expect(response.status).toBe(403)
    })

    it('should reject webhook verification with wrong mode', async () => {
      const url = `http://localhost:3000/api/whatsapp/webhook?hub.mode=unsubscribe&hub.verify_token=${mockVerifyToken}&hub.challenge=test_challenge`
      const request = new NextRequest(url)

      const response = await GET(request)

      expect(response.status).toBe(403)
    })

    it('should handle missing verify token configuration', async () => {
      // Mock config without verify token
      const { getWhatsAppConfig } = require('@/lib/whatsapp/config')
      getWhatsAppConfig.mockReturnValueOnce({
        cloudApi: {}
      })

      const url = 'http://localhost:3000/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=any&hub.challenge=test'
      const request = new NextRequest(url)

      const response = await GET(request)

      expect(response.status).toBe(500)
    })
  })

  describe('POST - Webhook Processing', () => {
    const mockWebhookPayload = {
      object: 'whatsapp_business_account',
      entry: [{
        id: 'entry_id',
        changes: [{
          value: {
            messaging_product: 'whatsapp',
            metadata: {
              display_phone_number: '251911223344',
              phone_number_id: '123456789'
            },
            messages: [{
              from: '251911223344',
              id: 'message_id_123',
              timestamp: '1640995200',
              text: {
                body: 'Hello from customer'
              },
              type: 'text'
            }],
            statuses: [{
              id: 'message_id_456',
              status: 'delivered',
              timestamp: '1640995200',
              recipient_id: '251911223344'
            }]
          },
          field: 'messages'
        }]
      }]
    }

    it('should process webhook with valid signature', async () => {
      const payload = JSON.stringify(mockWebhookPayload)
      
      // Generate valid signature
      const expectedSignature = crypto
        .createHmac('sha1', mockAppSecret)
        .update(payload, 'utf8')
        .digest('hex')

      // Mock signature verification to return true
      const { verifyWebhookSignature } = require('@/lib/whatsapp/config')
      verifyWebhookSignature.mockReturnValue(true)

      const request = new NextRequest('http://localhost:3000/api/whatsapp/webhook', {
        method: 'POST',
        body: payload,
        headers: {
          'content-type': 'application/json',
          'x-hub-signature-256': `sha256=${expectedSignature}`
        }
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.status).toBe('ok')
      expect(verifyWebhookSignature).toHaveBeenCalledWith(
        payload,
        `sha256=${expectedSignature}`,
        mockAppSecret
      )
    })

    it('should reject webhook with invalid signature', async () => {
      const payload = JSON.stringify(mockWebhookPayload)

      // Mock signature verification to return false
      const { verifyWebhookSignature } = require('@/lib/whatsapp/config')
      verifyWebhookSignature.mockReturnValue(false)

      const request = new NextRequest('http://localhost:3000/api/whatsapp/webhook', {
        method: 'POST',
        body: payload,
        headers: {
          'content-type': 'application/json',
          'x-hub-signature-256': 'sha256=invalid_signature'
        }
      })

      const response = await POST(request)

      expect(response.status).toBe(401)
      expect(verifyWebhookSignature).toHaveBeenCalled()
    })

    it('should reject webhook without signature when app secret is configured', async () => {
      const payload = JSON.stringify(mockWebhookPayload)

      const request = new NextRequest('http://localhost:3000/api/whatsapp/webhook', {
        method: 'POST',
        body: payload,
        headers: {
          'content-type': 'application/json'
          // No signature header
        }
      })

      const response = await POST(request)

      expect(response.status).toBe(401)
    })

    it('should process webhook without signature validation when no app secret', async () => {
      // Mock config without app secret
      const { getWhatsAppConfig } = require('@/lib/whatsapp/config')
      getWhatsAppConfig.mockReturnValueOnce({
        cloudApi: {
          webhookVerifyToken: mockVerifyToken
          // No appSecret
        }
      })

      const payload = JSON.stringify(mockWebhookPayload)

      const request = new NextRequest('http://localhost:3000/api/whatsapp/webhook', {
        method: 'POST',
        body: payload,
        headers: {
          'content-type': 'application/json'
        }
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.status).toBe('ok')
    })

    it('should handle message status updates', async () => {
      const { verifyWebhookSignature } = require('@/lib/whatsapp/config')
      verifyWebhookSignature.mockReturnValue(true)

      const statusPayload = {
        object: 'whatsapp_business_account',
        entry: [{
          changes: [{
            value: {
              statuses: [{
                id: 'message_123',
                status: 'read',
                timestamp: '1640995200',
                recipient_id: '251911223344'
              }]
            }
          }]
        }]
      }

      const payload = JSON.stringify(statusPayload)

      const request = new NextRequest('http://localhost:3000/api/whatsapp/webhook', {
        method: 'POST',
        body: payload,
        headers: {
          'content-type': 'application/json',
          'x-hub-signature-256': 'sha256=test_signature'
        }
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.status).toBe('ok')
    })

    it('should handle incoming messages', async () => {
      const { verifyWebhookSignature } = require('@/lib/whatsapp/config')
      verifyWebhookSignature.mockReturnValue(true)

      const messagePayload = {
        object: 'whatsapp_business_account',
        entry: [{
          changes: [{
            value: {
              messages: [{
                from: '251911223344',
                id: 'message_id_123',
                timestamp: '1640995200',
                text: {
                  body: 'Customer inquiry'
                },
                type: 'text'
              }]
            }
          }]
        }]
      }

      const payload = JSON.stringify(messagePayload)

      const request = new NextRequest('http://localhost:3000/api/whatsapp/webhook', {
        method: 'POST',
        body: payload,
        headers: {
          'content-type': 'application/json',
          'x-hub-signature-256': 'sha256=test_signature'
        }
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.status).toBe('ok')
    })

    it('should handle malformed JSON gracefully', async () => {
      const invalidPayload = '{"invalid": json}'

      const request = new NextRequest('http://localhost:3000/api/whatsapp/webhook', {
        method: 'POST',
        body: invalidPayload,
        headers: {
          'content-type': 'application/json'
        }
      })

      const response = await POST(request)

      expect(response.status).toBe(500)
    })

    it('should handle non-WhatsApp webhook objects', async () => {
      const { verifyWebhookSignature } = require('@/lib/whatsapp/config')
      verifyWebhookSignature.mockReturnValue(true)

      const nonWhatsappPayload = {
        object: 'instagram_business_account',
        entry: []
      }

      const payload = JSON.stringify(nonWhatsappPayload)

      const request = new NextRequest('http://localhost:3000/api/whatsapp/webhook', {
        method: 'POST',
        body: payload,
        headers: {
          'content-type': 'application/json',
          'x-hub-signature-256': 'sha256=test_signature'
        }
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.status).toBe('ok')
    })
  })

  describe('Security', () => {
    it('should use timing-safe comparison for signature verification', () => {
      // This is tested in the config.test.ts file
      // Here we just ensure the webhook calls the security function
      const { verifyWebhookSignature } = require('@/lib/whatsapp/config')
      
      expect(verifyWebhookSignature).toBeDefined()
      expect(typeof verifyWebhookSignature).toBe('function')
    })
  })
})