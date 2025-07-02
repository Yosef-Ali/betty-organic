import { NextRequest, NextResponse } from 'next/server';
import { getBaileysStatus } from '@/lib/whatsapp/baileys-service';

export async function GET(request: NextRequest) {
    try {
        const status = getBaileysStatus();

        return NextResponse.json({
            success: true,
            provider: 'Baileys WhatsApp',
            status: {
                connected: status.isConnected,
                connecting: status.isConnecting,
                hasClient: status.hasClient,
                attempts: status.attempts,
                maxAttempts: status.maxAttempts,
                canRetry: status.canRetry,
                message: status.isConnected ? 'Connected' :
                    status.isConnecting ? 'Connecting...' : 'Disconnected'
            },
            qrCode: status.qrCode,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error getting Baileys status:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        }, { status: 500 });
    }
}
