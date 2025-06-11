'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { testWhatsAppConnection } from '@/app/actions/whatsappActions'

export default function WhatsAppCloudAPITester() {
  const [phoneNumber, setPhoneNumber] = useState('')
  const [message, setMessage] = useState('Hello from Betty Organic! 🍎\n\nThis is a test message from our WhatsApp Cloud API integration.')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleSendTest = async () => {
    if (!phoneNumber.trim()) {
      setResult({ success: false, error: 'Please enter a phone number' })
      return
    }

    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: phoneNumber,
          message: message,
          type: 'text'
        })
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send message'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleTestConnection = async () => {
    setIsLoading(true)
    setResult(null)

    try {
      const connectionResult = await testWhatsAppConnection()
      setResult(connectionResult)
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Connection test failed'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>WhatsApp Cloud API Tester</CardTitle>
        <CardDescription>
          Test your WhatsApp Cloud API integration with Betty Organic App
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Phone Number (with country code)
          </label>
          <Input
            type="tel"
            placeholder="+251912345678"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Test Message
          </label>
          <Textarea
            placeholder="Enter your test message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
          />
        </div>

        <div className="flex space-x-2">
          <Button 
            onClick={handleSendTest} 
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? 'Sending...' : 'Send Test Message'}
          </Button>
          <Button 
            onClick={handleTestConnection} 
            disabled={isLoading}
            variant="outline"
            className="flex-1"
          >
            {isLoading ? 'Testing...' : 'Test Connection'}
          </Button>
        </div>

        {result && (
          <div className={`p-4 rounded-lg ${
            result.success 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <h3 className={`font-medium ${
              result.success ? 'text-green-800' : 'text-red-800'
            }`}>
              {result.success ? '✅ Success' : '❌ Error'}
            </h3>
            <p className={`text-sm mt-1 ${
              result.success ? 'text-green-700' : 'text-red-700'
            }`}>
              {result.message || result.error}
            </p>
            {result.messageId && (
              <p className="text-xs text-gray-600 mt-2">
                Message ID: {result.messageId}
              </p>
            )}
            {result.details && (
              <details className="mt-2">
                <summary className="text-xs cursor-pointer">
                  Technical Details
                </summary>
                <pre className="text-xs mt-1 overflow-auto">
                  {JSON.stringify(result.details, null, 2)}
                </pre>
              </details>
            )}
          </div>
        )}

        <div className="text-xs text-gray-500 space-y-1">
          <p><strong>Setup Requirements:</strong></p>
          <ul className="list-disc list-inside space-y-1">
            <li>Set WHATSAPP_ACCESS_TOKEN in .env.local</li>
            <li>Set WHATSAPP_PHONE_NUMBER_ID in .env.local</li>
            <li>Add test recipients in Meta Developer Console</li>
            <li>Configure webhook URL for production</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
