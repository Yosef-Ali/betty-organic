import { NextRequest, NextResponse } from 'next/server';
import { initializeBaileys, getBaileysStatus } from '@/lib/whatsapp/baileys-service';

export async function POST(request: NextRequest) {
    try {
        console.log('🚀 [BAILEYS INIT] Starting Baileys connection');

        const result = await initializeBaileys({
            sessionPath: './baileys-session',
            phoneNumber: process.env.ADMIN_PHONE_NUMBER || ''
        });

        const status = getBaileysStatus();

        return NextResponse.json({
            success: result.success,
            status: result.status,
            error: result.error,
            currentStatus: status,
            message: result.success ?
                'Baileys initialization started. Watch terminal for QR code.' :
                `Failed to initialize: ${result.error}`,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ [BAILEYS INIT] Error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        }, { status: 500 });
    }
}
