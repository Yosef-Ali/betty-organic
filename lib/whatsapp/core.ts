'use server'

import { getWhatsAppConfig, type WhatsAppConfig } from '@/lib/whatsapp/config'

export interface WhatsAppSettings {
    adminPhoneNumber: string
    enableOrderNotifications: boolean
    enableRealTimeNotifications: boolean
    notificationMessage: string
    apiProvider?: 'twilio' // Only Twilio is supported now
    apiKey?: string
    apiSecret?: string
}

// Centralized phone number formatting utility
export async function formatPhoneNumber(phoneNumber: string): Promise<string> {
    return phoneNumber.replace(/[\s\-\(\)\+]/g, '')
}

export async function getWhatsAppSettings(): Promise<WhatsAppSettings | null> {
    try {
        const config = getWhatsAppConfig()

        // Only Twilio provider is supported
        const apiKey = config.twilio.accountSid
        const apiSecret = config.twilio.authToken

        return {
            adminPhoneNumber: config.adminPhoneNumber,
            enableOrderNotifications: config.enableOrderNotifications,
            enableRealTimeNotifications: config.enableRealTimeNotifications,
            notificationMessage: config.notificationMessage,
            apiProvider: 'twilio',
            apiKey,
            apiSecret
        }
    } catch (error) {
        console.error('Failed to get WhatsApp settings:', error)
        return null
    }
}

export async function updateWhatsAppSettings(settings: WhatsAppSettings) {
    try {
        // For now, just log the settings
        // In a real implementation, you would save to database
        console.log('WhatsApp settings updated:', settings)

        return {
            success: true,
            message: 'Settings updated successfully'
        }
    } catch (error) {
        console.error('Failed to update WhatsApp settings:', error)
        return {
            success: false,
            error: 'Failed to update settings'
        }
    }
}

// Simplified Twilio WhatsApp API implementation
export async function sendTwilioWhatsApp({
    phoneNumber,
    message,
    mediaUrl,
    settings,
}: {
    phoneNumber: string;
    message?: string;
    mediaUrl?: string;
    settings: WhatsAppSettings;
}): Promise<{ success: boolean; error?: string; messageId?: string }> {
    try {
        if (!settings.apiKey || !settings.apiSecret) {
            throw new Error('Twilio API credentials not configured');
        }

        const twilioAccountSid = settings.apiKey;
        const twilioAuthToken = settings.apiSecret;
        const twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER;

        if (!twilioWhatsAppNumber) {
            throw new Error('TWILIO_WHATSAPP_NUMBER is not configured');
        }

        const payload: Record<string, string> = {
            From: twilioWhatsAppNumber,
            To: `whatsapp:${await formatPhoneNumber(phoneNumber)}`,
        };

        if (message) payload.Body = message;
        if (mediaUrl) payload.MediaUrl = mediaUrl;

        const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${Buffer.from(`${twilioAccountSid}:${twilioAuthToken}`).toString('base64')}`
            },
            body: new URLSearchParams(payload)
        });

        const result = await response.json();

        if (response.ok && result.sid) {
            return { success: true, messageId: result.sid };
        } else {
            throw new Error(result.message || result.detail || 'Twilio API error');
        }
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Twilio API error'
        };
    }
}

// Only Twilio WhatsApp sending is supported now
export async function sendWhatsAppMessage(
    phoneNumber: string,
    message: string,
    settings: WhatsAppSettings,
    mediaUrl?: string
): Promise<{ success: boolean; error?: string; messageId?: string }> {
    return sendTwilioWhatsApp({ phoneNumber, message, mediaUrl, settings });
}

// Test WhatsApp connection
export async function testWhatsAppConnection() {
    try {
        const settings = await getWhatsAppSettings()

        if (!settings) {
            return {
                success: false,
                error: 'WhatsApp settings not found'
            }
        }

        const testMessage = `🧪 *Test Message - Betty Organic*\n\nThis is a test message from your Betty Organic WhatsApp integration.\n\nProvider: ${settings.apiProvider || 'twilio'}\nTime: ${new Date().toLocaleString()}\n\nIf you received this message, your WhatsApp integration is working correctly! ✅`

        const result = await sendWhatsAppMessage(
            settings.adminPhoneNumber,
            testMessage,
            settings
        )

        return {
            success: result.success,
            message: result.success
                ? `Test message sent successfully via ${settings.apiProvider}`
                : `Test failed: ${result.error}`,
            provider: settings.apiProvider,
            messageId: result.messageId,
            error: result.error
        }
    } catch (error) {
        console.error('WhatsApp connection test failed:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Test failed'
        }
    }
}

// Get comprehensive WhatsApp configuration diagnostics
export async function getWhatsAppDiagnostics() {
    try {
        const { diagnoseConfiguration } = await import('@/lib/whatsapp/config')
        const diagnostics = diagnoseConfiguration()

        return {
            success: true,
            data: diagnostics
        }
    } catch (error) {
        console.error('Failed to get WhatsApp diagnostics:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get diagnostics'
        }
    }
}
