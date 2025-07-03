/**
 * Vercel-Compatible WhatsApp API Service
 * 
 * This service replaces Baileys with a production-ready WhatsApp Business API
 * that works seamlessly on Vercel serverless functions.
 * 
 * Supported Providers:
 * 1. Meta WhatsApp Cloud API (Free tier available)
 * 2. Twilio WhatsApp API (Easy setup)
 * 3. 360Dialog (European alternative)
 */

export interface WhatsAppProvider {
    name: string;
    send(to: string, message: string): Promise<WhatsAppResult>;
    sendTemplate?(to: string, templateName: string, params: any[]): Promise<WhatsAppResult>;
}

export interface WhatsAppResult {
    success: boolean;
    messageId?: string;
    error?: string;
    provider?: string;
}

/**
 * Meta WhatsApp Cloud API Provider
 * Free tier: 1000 messages/month
 * Setup: https://developers.facebook.com/docs/whatsapp/cloud-api
 */
class MetaWhatsAppProvider implements WhatsAppProvider {
    name = 'Meta WhatsApp Cloud API';
    private accessToken: string;
    private phoneNumberId: string;

    constructor() {
        this.accessToken = process.env.META_WHATSAPP_ACCESS_TOKEN || '';
        this.phoneNumberId = process.env.META_WHATSAPP_PHONE_NUMBER_ID || '';
    }

    async send(to: string, message: string): Promise<WhatsAppResult> {
        try {
            if (!this.accessToken || !this.phoneNumberId) {
                throw new Error('Meta WhatsApp credentials not configured');
            }

            const url = `https://graph.facebook.com/v18.0/${this.phoneNumberId}/messages`;

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messaging_product: 'whatsapp',
                    to: to.replace(/\D/g, ''), // Remove non-digits
                    type: 'text',
                    text: { body: message }
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error?.message || 'Meta API request failed');
            }

            console.log('✅ Meta WhatsApp message sent:', data.messages?.[0]?.id);

            return {
                success: true,
                messageId: data.messages?.[0]?.id,
                provider: this.name
            };

        } catch (error) {
            console.error('❌ Meta WhatsApp error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown Meta API error',
                provider: this.name
            };
        }
    }
}

/**
 * Twilio WhatsApp API Provider
 * Easy setup, reliable delivery
 * Setup: https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn
 */
class TwilioWhatsAppProvider implements WhatsAppProvider {
    name = 'Twilio WhatsApp API';
    private accountSid: string;
    private authToken: string;
    private fromNumber: string;

    constructor() {
        this.accountSid = process.env.TWILIO_ACCOUNT_SID || '';
        this.authToken = process.env.TWILIO_AUTH_TOKEN || '';
        this.fromNumber = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886'; // Twilio sandbox
    }

    async send(to: string, message: string): Promise<WhatsAppResult> {
        try {
            if (!this.accountSid || !this.authToken) {
                throw new Error('Twilio credentials not configured');
            }

            const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`;

            const body = new URLSearchParams({
                From: this.fromNumber,
                To: `whatsapp:${to}`,
                Body: message
            });

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': 'Basic ' + Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64'),
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: body
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Twilio API request failed');
            }

            console.log('✅ Twilio WhatsApp message sent:', data.sid);

            return {
                success: true,
                messageId: data.sid,
                provider: this.name
            };

        } catch (error) {
            console.error('❌ Twilio WhatsApp error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown Twilio error',
                provider: this.name
            };
        }
    }
}

/**
 * 360Dialog WhatsApp API Provider
 * European provider, GDPR compliant
 * Setup: https://docs.360dialog.com/
 */
class Dialog360WhatsAppProvider implements WhatsAppProvider {
    name = '360Dialog WhatsApp API';
    private apiKey: string;
    private channelId: string;

    constructor() {
        this.apiKey = process.env.DIALOG360_API_KEY || '';
        this.channelId = process.env.DIALOG360_CHANNEL_ID || '';
    }

    async send(to: string, message: string): Promise<WhatsAppResult> {
        try {
            if (!this.apiKey || !this.channelId) {
                throw new Error('360Dialog credentials not configured');
            }

            const url = `https://waba.360dialog.io/v1/messages`;

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'D360-API-KEY': this.apiKey,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    to: to.replace(/\D/g, ''),
                    type: 'text',
                    text: { body: message }
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error?.message || '360Dialog API request failed');
            }

            console.log('✅ 360Dialog WhatsApp message sent:', data.messages?.[0]?.id);

            return {
                success: true,
                messageId: data.messages?.[0]?.id,
                provider: this.name
            };

        } catch (error) {
            console.error('❌ 360Dialog WhatsApp error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown 360Dialog error',
                provider: this.name
            };
        }
    }
}

/**
 * Multi-Provider WhatsApp Service
 * Automatically tries multiple providers for maximum reliability
 */
class WhatsAppService {
    private providers: WhatsAppProvider[] = [];

    constructor() {
        // Initialize available providers based on environment variables
        if (process.env.META_WHATSAPP_ACCESS_TOKEN && process.env.META_WHATSAPP_PHONE_NUMBER_ID) {
            this.providers.push(new MetaWhatsAppProvider());
        }

        if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
            this.providers.push(new TwilioWhatsAppProvider());
        }

        if (process.env.DIALOG360_API_KEY && process.env.DIALOG360_CHANNEL_ID) {
            this.providers.push(new Dialog360WhatsAppProvider());
        }

        console.log(`📱 WhatsApp Service initialized with ${this.providers.length} providers:`,
            this.providers.map(p => p.name));
    }

    async sendMessage(to: string, message: string): Promise<WhatsAppResult> {
        if (this.providers.length === 0) {
            console.warn('⚠️ No WhatsApp providers configured');
            return {
                success: false,
                error: 'No WhatsApp API providers configured. Please set up Meta, Twilio, or 360Dialog credentials.'
            };
        }

        // Try each provider until one succeeds
        for (const provider of this.providers) {
            console.log(`🔄 Trying ${provider.name}...`);

            const result = await provider.send(to, message);

            if (result.success) {
                console.log(`✅ Message sent successfully via ${provider.name}`);
                return result;
            } else {
                console.warn(`❌ ${provider.name} failed:`, result.error);
            }
        }

        // All providers failed
        return {
            success: false,
            error: `All WhatsApp providers failed. Tried: ${this.providers.map(p => p.name).join(', ')}`
        };
    }

    getAvailableProviders(): string[] {
        return this.providers.map(p => p.name);
    }

    isConfigured(): boolean {
        return this.providers.length > 0;
    }
}

// Export singleton instance
export const whatsAppService = new WhatsAppService();

// Helper function for backward compatibility with existing code
export async function sendWhatsAppMessage(to: string, message: string): Promise<WhatsAppResult> {
    console.log('📱 [VERCEL-WHATSAPP] Sending message via API providers...');

    const result = await whatsAppService.sendMessage(to, message);

    if (result.success) {
        console.log('✅ [VERCEL-WHATSAPP] Message sent successfully:', {
            provider: result.provider,
            messageId: result.messageId,
            to: to
        });
    } else {
        console.error('❌ [VERCEL-WHATSAPP] Message failed:', result.error);
    }

    return result;
}

export default whatsAppService;
