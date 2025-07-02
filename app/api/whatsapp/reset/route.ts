import { NextRequest, NextResponse } from 'next/server';
import { getWhatsAppConfig } from '@/lib/whatsapp/config';
import { resetBaileysConnection } from '@/lib/whatsapp/baileys-service';

export async function POST(request: NextRequest) {
    try {
        console.log('🔄 [RESET API] Received reset request');

        const config = getWhatsAppConfig();
        console.log(`🔄 [RESET API] Resetting provider: ${config.provider}`);

        let result;

        // Reset based on the configured provider
        switch (config.provider) {
            case 'baileys':
                console.log('🔄 [RESET API] Resetting Baileys WhatsApp connection');
                result = await resetBaileysConnection();
                break;

            case 'whatsapp-web-js':
                console.log('🔄 [RESET API] WhatsApp Web.js reset not implemented');
                result = { success: false, error: 'Reset not available for WhatsApp Web.js' };
                break;

            case 'cloud-api':
                console.log('🔄 [RESET API] Cloud API reset not needed');
                result = { success: true, message: 'Cloud API does not require reset' };
                break;

            case 'manual':
            default:
                console.log('🔄 [RESET API] Manual mode reset not needed');
                result = { success: true, message: 'Manual mode does not require reset' };
                break;
        }

        console.log('🔄 [RESET API] Reset result:', result);

        return NextResponse.json(result);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        console.error(`🔄 [RESET API] Error: ${errorMessage}`, error);
        return NextResponse.json({
            success: false,
            error: 'Failed to reset connection: ' + errorMessage
        }, { status: 500 });
    }
}
