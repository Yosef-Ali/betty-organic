'use client'

import { useState } from 'react'
import { testWhatsAppConnection } from '@/app/actions/whatsappActions'

export default function TestTwilioPage() {
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSendTestTemplate = async () => {
        setLoading(true)
        setMessage('')
        setError('')
        try {
            const result = await testWhatsAppConnection()
            if (result.success) {
                setMessage(result.message || 'Test template sent successfully!')
            } else {
                setError(result.error || 'Failed to send test template.')
            }
        } catch (e: any) {
            setError(e.message || 'An unexpected error occurred.')
        }
        setLoading(false)
    }

    return (
        <div style={{ padding: '20px' }}>
            <h1>Test Twilio Template Message</h1>
            <button onClick={handleSendTestTemplate} disabled={loading}>
                {loading ? 'Sending...' : 'Send Test Template to Admin'}
            </button>
            {message && <p style={{ color: 'green' }}>{message}</p>}
            {error && <p style={{ color: 'red' }}>Error: {error}</p>}
            <p>
                This will attempt to send a pre-configured Twilio template message
                (ContentSid: HXb5b62575e6e4ff6129ad7c8efe1f983e) to the
                ADMIN_WHATSAPP_NUMBER defined in your .env.local file.
            </p>
            <p>
                Make sure your WhatsApp settings in the application are configured to use 'twilio' as the apiProvider.
            </p>
        </div>
    )
}
