'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, XCircle, AlertCircle, MessageCircle } from 'lucide-react'

export default function TestIntegrationPage() {
  const [envStatus, setEnvStatus] = useState<any>(null)
  const [testResult, setTestResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const checkEnvironment = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/debug-env')
      const data = await response.json()
      setEnvStatus(data)
    } catch (error) {
      console.error('Failed to check environment:', error)
    } finally {
      setLoading(false)
    }
  }

  const testWhatsApp = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/debug-env', { method: 'POST' })
      const data = await response.json()
      setTestResult(data)
    } catch (error) {
      console.error('Failed to test WhatsApp:', error)
      setTestResult({ success: false, error: 'Network error' })
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (hasIssues: boolean) => {
    if (hasIssues) {
      return <XCircle className="w-5 h-5 text-red-500" />
    }
    return <CheckCircle className="w-5 h-5 text-green-500" />
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">WhatsApp Integration Test</h1>
          <p className="text-muted-foreground mt-2">
            Test your Vercel environment variables and WhatsApp API integration
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Environment Check */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Environment Variables
              </CardTitle>
              <CardDescription>
                Check if all required environment variables are set in Vercel
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={checkEnvironment} disabled={loading} className="w-full">
                {loading ? 'Checking...' : 'Check Environment'}
              </Button>

              {envStatus && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Overall Status:</span>
                    {getStatusIcon(envStatus.issues.some((i: string) => i.includes('❌')))}
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="font-medium">Issues Found:</div>
                    {envStatus.issues.map((issue: string, index: number) => (
                      <div key={index} className={`p-2 rounded ${
                        issue.includes('✅') ? 'bg-green-50 text-green-700' :
                        issue.includes('❌') ? 'bg-red-50 text-red-700' :
                        'bg-yellow-50 text-yellow-700'
                      }`}>
                        {issue}
                      </div>
                    ))}
                  </div>

                  <details className="text-xs">
                    <summary className="cursor-pointer font-medium">View Details</summary>
                    <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto">
                      {JSON.stringify(envStatus, null, 2)}
                    </pre>
                  </details>
                </div>
              )}
            </CardContent>
          </Card>

          {/* WhatsApp Test */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                WhatsApp API Test
              </CardTitle>
              <CardDescription>
                Send a test message to verify the integration works
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={testWhatsApp} disabled={loading} className="w-full">
                {loading ? 'Sending...' : 'Send Test Message'}
              </Button>

              {testResult && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Test Result:</span>
                    {getStatusIcon(!testResult.success)}
                  </div>
                  
                  <div className={`p-3 rounded ${
                    testResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                  }`}>
                    {testResult.success ? (
                      <div>
                        <div className="font-medium">✅ Success!</div>
                        <div className="text-sm">Message ID: {testResult.messageId}</div>
                        <div className="text-sm">Check your WhatsApp for the test message</div>
                      </div>
                    ) : (
                      <div>
                        <div className="font-medium">❌ Failed</div>
                        <div className="text-sm">{testResult.error}</div>
                      </div>
                    )}
                  </div>

                  <details className="text-xs">
                    <summary className="cursor-pointer font-medium">View Response</summary>
                    <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto">
                      {JSON.stringify(testResult, null, 2)}
                    </pre>
                  </details>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="font-medium">1. Check Environment Variables</div>
              <div className="text-sm text-muted-foreground">
                Click "Check Environment" to verify your Vercel environment variables are set correctly.
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="font-medium">2. Test WhatsApp Integration</div>
              <div className="text-sm text-muted-foreground">
                Click "Send Test Message" to send a WhatsApp message to your admin number.
                If successful, you should receive a message on WhatsApp.
              </div>
            </div>

            <div className="space-y-2">
              <div className="font-medium">3. Common Issues</div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Access token expired (get new one from Meta Developer Console)</li>
                <li>• Phone number not added as test recipient in Meta Console</li>
                <li>• Environment variables not set correctly in Vercel</li>
                <li>• Wrong phone number format (must include +251 country code)</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}