import { NextRequest, NextResponse } from 'next/server';
import { getWhatsAppConfig } from '@/lib/whatsapp/config';
import { testWhatsAppWebJsConnection } from '@/lib/whatsapp/webjs-service';
import { testManualConnection } from '@/lib/whatsapp/manual-service';
import { testCloudAPIConnection } from '@/lib/whatsapp/cloud-api-service';
import { testBaileysConnection } from '@/lib/whatsapp/baileys-service';

export async function POST(request: NextRequest) {
    try {
        console.log('📱 [TEST API] Received test request');

        const body = await request.json();
        console.log('📱 [TEST API] Request body:', body);

        const { phoneNumber } = body;

        if (!phoneNumber) {
            console.error('📱 [TEST API] No phone number provided');
            return NextResponse.json({
                success: false,
                error: 'Phone number is required'
            }, { status: 400 });
        }

        // Get the configured provider
        const config = getWhatsAppConfig();
        console.log(`📱 [TEST API] Testing with provider: ${config.provider} and phone: ${phoneNumber}`);

        let result;

        // Test based on the configured provider
        switch (config.provider) {
            case 'cloud-api':
                console.log('📱 [TEST API] Testing WhatsApp Cloud API');
                result = await testCloudAPIConnection(phoneNumber);
                break;

            case 'whatsapp-web-js':
                console.log('📱 [TEST API] Testing WhatsApp Web.js');
                result = await testWhatsAppWebJsConnection(phoneNumber);
                break;

            case 'baileys':
                console.log('📱 [TEST API] Testing Baileys WhatsApp');
                result = await testBaileysConnection(phoneNumber);
                break;

            case 'manual':
            default:
                console.log('📱 [TEST API] Testing Manual WhatsApp Mode');
                result = await testManualConnection(phoneNumber);
                break;
        }

        console.log('📱 [TEST API] Test result:', result);

        return NextResponse.json(result);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        console.error(`📱 [TEST API] Error: ${errorMessage}`, error);
        return NextResponse.json({
            success: false,
            error: 'Failed to send test message: ' + errorMessage
        }, { status: 500 });
    }
}
