import { NextResponse } from 'next/server';
import { getWhatsAppConfig } from '@/lib/whatsapp/config';

export async function GET() {
    try {
        const config = getWhatsAppConfig();

        return NextResponse.json({
            success: true,
            provider: config.provider,
            adminPhoneNumber: config.adminPhoneNumber,
            enableOrderNotifications: config.enableOrderNotifications,
            enableRealTimeNotifications: config.enableRealTimeNotifications,
            environment: {
                NODE_ENV: process.env.NODE_ENV,
                WHATSAPP_API_PROVIDER: process.env.WHATSAPP_API_PROVIDER,
                ADMIN_WHATSAPP_NUMBER: process.env.ADMIN_WHATSAPP_NUMBER,
                hasAccessToken: !!process.env.WHATSAPP_ACCESS_TOKEN,
                hasPhoneNumberId: !!process.env.WHATSAPP_PHONE_NUMBER_ID
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error getting provider debug info:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        }, { status: 500 });
    }
}
