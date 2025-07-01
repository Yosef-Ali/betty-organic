'use server'

// WhatsApp Cloud API Service
export interface CloudAPIConfig {
    accessToken: string
    phoneNumberId: string
    version?: string
    baseUrl?: string
}

export interface WhatsAppMessage {
    messaging_product: 'whatsapp'
    to: string
    type: 'text' | 'image' | 'document'
    text?: {
        body: string
    }
    image?: {
        link?: string
        caption?: string
    }
    document?: {
        link?: string
        caption?: string
        filename?: string
    }
}

export interface CloudAPIResponse {
    messaging_product: string
    contacts: Array<{
        input: string
        wa_id: string
    }>
    messages: Array<{
        id: string
    }>
}

export async function getCloudAPIConfig(): Promise<CloudAPIConfig> {
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID

    if (!accessToken || !phoneNumberId) {
        throw new Error('WhatsApp Cloud API credentials not configured')
    }

    return {
        accessToken,
        phoneNumberId,
        version: 'v21.0',
        baseUrl: 'https://graph.facebook.com'
    }
}

export async function sendCloudAPIMessage({
    phoneNumber,
    message,
    mediaUrl,
    mediaCaption,
    mediaType = 'image'
}: {
    phoneNumber: string
    message?: string
    mediaUrl?: string
    mediaCaption?: string
    mediaType?: 'image' | 'document'
}): Promise<{
    success: boolean
    messageId?: string
    error?: string
}> {
    try {
        const config = await getCloudAPIConfig()

        // Format phone number (remove + and ensure it's properly formatted)
        const formattedNumber = phoneNumber.replace(/^\+/, '').replace(/\D/g, '')

        // Construct the message payload
        let messagePayload: WhatsAppMessage

        if (mediaUrl) {
            if (mediaType === 'image') {
                messagePayload = {
                    messaging_product: 'whatsapp',
                    to: formattedNumber,
                    type: 'image',
                    image: {
                        link: mediaUrl,
                        caption: mediaCaption || message
                    }
                }
            } else {
                messagePayload = {
                    messaging_product: 'whatsapp',
                    to: formattedNumber,
                    type: 'document',
                    document: {
                        link: mediaUrl,
                        caption: mediaCaption || message,
                        filename: 'document.pdf'
                    }
                }
            }
        } else {
            messagePayload = {
                messaging_product: 'whatsapp',
                to: formattedNumber,
                type: 'text',
                text: {
                    body: message || 'Hello from Betty Organic!'
                }
            }
        }

        console.log('📤 Sending WhatsApp Cloud API message:', {
            to: formattedNumber,
            type: messagePayload.type,
            hasMedia: !!mediaUrl
        })

        // Send the message via Cloud API
        const url = `${config.baseUrl}/${config.version}/${config.phoneNumberId}/messages`

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${config.accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(messagePayload)
        })

        const responseData = await response.json()

        if (!response.ok) {
            console.error('❌ WhatsApp Cloud API error:', responseData)
            return {
                success: false,
                error: responseData.error?.message || `HTTP ${response.status}: ${response.statusText}`
            }
        }

        console.log('✅ WhatsApp Cloud API message sent:', responseData)

        return {
            success: true,
            messageId: responseData.messages?.[0]?.id || 'cloud_api_' + Date.now()
        }
    } catch (error) {
        console.error('WhatsApp Cloud API error:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown Cloud API error'
        }
    }
}

export async function initializeCloudAPI(): Promise<{
    success: boolean
    message: string
    error?: string
}> {
    try {
        const config = await getCloudAPIConfig()

        // Test the configuration by making a simple API call
        const url = `${config.baseUrl}/${config.version}/${config.phoneNumberId}`

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${config.accessToken}`
            }
        })

        if (!response.ok) {
            const errorData = await response.json()
            return {
                success: false,
                message: 'Cloud API initialization failed',
                error: errorData.error?.message || `HTTP ${response.status}`
            }
        }

        return {
            success: true,
            message: 'WhatsApp Cloud API initialized successfully'
        }
    } catch (error) {
        return {
            success: false,
            message: 'Cloud API initialization failed',
            error: error instanceof Error ? error.message : 'Unknown error'
        }
    }
}

export async function getCloudAPIStatus(): Promise<{
    isReady: boolean
    isAuthenticating: boolean
    qrCode?: string
    sessionExists: boolean
    isManualMode: boolean
}> {
    try {
        const config = await getCloudAPIConfig()

        // Check if credentials are available
        const isReady = !!(config.accessToken && config.phoneNumberId)

        return {
            isReady,
            isAuthenticating: false, // Cloud API doesn't need authentication
            sessionExists: isReady,
            isManualMode: false
        }
    } catch (error) {
        return {
            isReady: false,
            isAuthenticating: false,
            sessionExists: false,
            isManualMode: true // Fallback to manual mode if Cloud API not configured
        }
    }
}

export async function testCloudAPIConnection(phoneNumber: string): Promise<{
    success: boolean
    message: string
    messageId?: string
}> {
    const testMessage = `🧪 *Test Message - Betty Organic*

This is a test message from your Betty Organic WhatsApp Cloud API integration.

Provider: WhatsApp Cloud API (Meta Business)
Time: ${new Date().toLocaleString()}

If you can see this message, the WhatsApp integration is working correctly! ✅`

    try {
        const result = await sendCloudAPIMessage({
            phoneNumber,
            message: testMessage
        })

        if (result.success) {
            return {
                success: true,
                message: 'Test message sent successfully via Cloud API',
                messageId: result.messageId
            }
        } else {
            return {
                success: false,
                message: `Cloud API test failed: ${result.error}`
            }
        }
    } catch (error) {
        return {
            success: false,
            message: 'Cloud API test failed with exception'
        }
    }
}
