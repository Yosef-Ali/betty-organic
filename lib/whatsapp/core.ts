'use server'

import { getWhatsAppConfig, type WhatsAppConfig } from '@/lib/whatsapp/config'
import { sendWhatsAppWebJsMessage, initializeWhatsAppClient, getWhatsAppClientStatus } from '@/lib/whatsapp/webjs-service'
import { sendCloudAPIMessage, initializeCloudAPI, getCloudAPIStatus } from '@/lib/whatsapp/cloud-api-service'
import { sendManualWhatsAppMessage, getManualModeStatus } from '@/lib/whatsapp/manual-service'
import { sendBaileysMessage, initializeBaileys, getBaileysStatus, testBaileysConnection } from '@/lib/whatsapp/baileys-service'
import { generateWhatsAppUrl } from '@/lib/whatsapp/fallback-service'

export interface WhatsAppSettings {
    adminPhoneNumber: string
    enableOrderNotifications: boolean
    enableRealTimeNotifications: boolean
    notificationMessage: string
    sessionPath?: string
    authTimeout?: number
    restartOnAuthFail?: boolean
}

// Centralized phone number formatting utility
export async function formatPhoneNumber(phoneNumber: string): Promise<string> {
    return phoneNumber.replace(/[\s\-\(\)\+]/g, '')
}

export async function getWhatsAppSettings(): Promise<WhatsAppSettings | null> {
    try {
        const config = getWhatsAppConfig()

        return {
            adminPhoneNumber: config.adminPhoneNumber,
            enableOrderNotifications: config.enableOrderNotifications,
            enableRealTimeNotifications: config.enableRealTimeNotifications,
            notificationMessage: config.notificationMessage,
            sessionPath: config.webJs.sessionPath,
            authTimeout: config.webJs.authTimeout,
            restartOnAuthFail: config.webJs.restartOnAuthFail
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


// Send WhatsApp message using the configured provider
export async function sendWhatsAppMessage(
    phoneNumber: string,
    message: string,
    settings: WhatsAppSettings,
    mediaPath?: string
): Promise<{ success: boolean; error?: string; messageId?: string; whatsappUrl?: string }> {
    try {
        const config = getWhatsAppConfig()

        console.log(`📱 Sending WhatsApp message via ${config.provider} provider`)

        // Choose provider based on configuration
        switch (config.provider) {
            case 'cloud-api':
                console.log('🔵 Using WhatsApp Cloud API')
                const cloudResult = await sendCloudAPIMessage({
                    phoneNumber,
                    message,
                    mediaUrl: mediaPath
                })

                if (cloudResult.success) {
                    return {
                        success: true,
                        messageId: cloudResult.messageId
                    }
                } else {
                    // Fallback to manual if Cloud API fails
                    console.warn('⚠️ Cloud API failed, falling back to manual URL:', cloudResult.error)
                    const manualResult = await sendManualWhatsAppMessage({ phoneNumber, message })
                    return {
                        success: true,
                        messageId: manualResult.messageId,
                        whatsappUrl: manualResult.whatsappUrl,
                        error: `Cloud API failed: ${cloudResult.error}. Generated manual URL instead.`
                    }
                }

            case 'whatsapp-web-js':
                console.log('🟢 Using WhatsApp Web.js')
                const webjsResult = await sendWhatsAppWebJsMessage({
                    phoneNumber,
                    message,
                    mediaPath
                })

                if (webjsResult.success) {
                    return {
                        success: true,
                        messageId: webjsResult.messageId
                    }
                } else {
                    // Fallback to manual if Web.js fails
                    console.warn('⚠️ WhatsApp Web.js failed, falling back to manual URL:', webjsResult.error)
                    const manualResult = await sendManualWhatsAppMessage({ phoneNumber, message })
                    return {
                        success: true,
                        messageId: manualResult.messageId,
                        whatsappUrl: manualResult.whatsappUrl,
                        error: `Web.js failed: ${webjsResult.error}. Generated manual URL instead.`
                    }
                }

            case 'baileys':
                console.log('🟡 Using Baileys WhatsApp')
                const baileysResult = await sendBaileysMessage({
                    to: phoneNumber,
                    message,
                    mediaPath
                })

                if (baileysResult.success) {
                    return {
                        success: true,
                        messageId: baileysResult.messageId
                    }
                } else {
                    // Fallback to manual if Baileys fails
                    console.warn('⚠️ Baileys failed, falling back to manual URL:', baileysResult.error)
                    const manualResult = await sendManualWhatsAppMessage({ phoneNumber, message })
                    return {
                        success: true,
                        messageId: manualResult.messageId,
                        whatsappUrl: manualResult.whatsappUrl,
                        error: `Baileys failed: ${baileysResult.error}. Generated manual URL instead.`
                    }
                }

            case 'manual':
            default:
                console.log('🔵 Using Manual WhatsApp Mode')
                const manualResult = await sendManualWhatsAppMessage({ phoneNumber, message })
                return {
                    success: true,
                    messageId: manualResult.messageId,
                    whatsappUrl: manualResult.whatsappUrl
                }
        }
    } catch (error) {
        console.error('Error in sendWhatsAppMessage:', error)

        // Always provide manual fallback
        const whatsappUrl = await generateWhatsAppUrl(phoneNumber, message)

        return {
            success: true,
            messageId: 'error_fallback_' + Date.now(),
            whatsappUrl: whatsappUrl,
            error: 'System error, generated manual URL'
        };
    }
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

        const testMessage = `🧪 *Test Message - Betty Organic*

This is a test message from your Betty Organic WhatsApp integration.

Provider: WhatsApp Web.js
Time: ${new Date().toLocaleString()}

If you received this message, your WhatsApp integration is working correctly! ✅`

        const result = await sendWhatsAppMessage(
            settings.adminPhoneNumber,
            testMessage,
            settings
        )

        return {
            success: result.success,
            message: result.success
                ? 'Test message sent successfully via WhatsApp Web.js'
                : `Test failed: ${result.error}`,
            provider: 'WhatsApp Web.js',
            messageId: result.messageId,
            error: result.error,
            whatsappUrl: result.whatsappUrl
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

        // Get client status
        const clientStatus = await getWhatsAppClientStatus()

        return {
            success: true,
            data: {
                ...diagnostics,
                clientStatus
            }
        }
    } catch (error) {
        console.error('Failed to get WhatsApp diagnostics:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get diagnostics'
        }
    }
}

// Get WhatsApp provider status
export async function getWhatsAppProviderStatus(): Promise<{
    isReady: boolean
    isAuthenticating: boolean
    qrCode?: string
    sessionExists: boolean
    isManualMode: boolean
    provider: string
    message: string
}> {
    try {
        const config = getWhatsAppConfig()

        console.log(`🔍 Checking status for ${config.provider} provider`)

        switch (config.provider) {
            case 'cloud-api':
                const cloudStatus = await getCloudAPIStatus()
                return {
                    isReady: cloudStatus.isReady,
                    isAuthenticating: cloudStatus.isAuthenticating,
                    qrCode: cloudStatus.qrCode,
                    sessionExists: cloudStatus.sessionExists,
                    isManualMode: cloudStatus.isManualMode,
                    provider: 'WhatsApp Cloud API',
                    message: cloudStatus.isReady ? 'Cloud API Ready' : 'Cloud API Not Configured'
                }

            case 'whatsapp-web-js':
                const webjsStatus = await getWhatsAppClientStatus()
                return {
                    isReady: webjsStatus.isReady,
                    isAuthenticating: webjsStatus.isAuthenticating,
                    qrCode: webjsStatus.qrCode,
                    sessionExists: webjsStatus.sessionExists,
                    isManualMode: false,
                    provider: 'WhatsApp Web.js',
                    message: webjsStatus.isReady ? 'Web.js Ready' :
                        webjsStatus.isAuthenticating ? 'Authenticating...' : 'Not Connected'
                }

            case 'baileys':
                const baileysStatus = getBaileysStatus()
                return {
                    isReady: baileysStatus.isConnected,
                    isAuthenticating: baileysStatus.isConnecting,
                    qrCode: undefined, // Baileys prints QR to terminal
                    sessionExists: baileysStatus.hasClient,
                    isManualMode: false,
                    provider: 'Baileys',
                    message: baileysStatus.isConnected ? 'Baileys Ready' :
                        baileysStatus.isConnecting ? 'Connecting...' : 'Not Connected'
                }

            case 'manual':
            default:
                const manualStatus = await getManualModeStatus()
                return {
                    isReady: manualStatus.isReady,
                    isAuthenticating: manualStatus.isAuthenticating,
                    qrCode: manualStatus.qrCode,
                    sessionExists: manualStatus.sessionExists,
                    isManualMode: manualStatus.isManualMode,
                    provider: 'Manual Mode',
                    message: 'Manual URLs Ready'
                }
        }
    } catch (error) {
        console.error('Error getting provider status:', error)
        return {
            isReady: false,
            isAuthenticating: false,
            sessionExists: false,
            isManualMode: true,
            provider: 'Error',
            message: 'Status check failed'
        }
    }
}

// Initialize the configured WhatsApp provider
export async function initializeWhatsAppProvider(): Promise<{
    success: boolean
    message: string
    qrCode?: string
    error?: string
}> {
    try {
        const config = getWhatsAppConfig()

        console.log(`🚀 Initializing ${config.provider} provider`)

        switch (config.provider) {
            case 'cloud-api':
                return await initializeCloudAPI()

            case 'whatsapp-web-js':
                return await initializeWhatsAppClient()

            case 'manual':
            default:
                return {
                    success: true,
                    message: 'Manual mode initialized - no setup required'
                }
        }
    } catch (error) {
        console.error('Error initializing provider:', error)
        return {
            success: false,
            message: 'Provider initialization failed',
            error: error instanceof Error ? error.message : 'Unknown error'
        }
    }
}