import { NextResponse } from 'next/server';
import { getWhatsAppClientStatus } from '@/lib/whatsapp/webjs-service';

export async function GET() {
    try {
        const status = await getWhatsAppClientStatus();

        return NextResponse.json({
            success: true,
            status,
            timestamp: new Date().toISOString(),
            debug: {
                message: 'Use this endpoint to check WhatsApp client status in real-time'
            }
        });
    } catch (error) {
        console.error('Error getting WhatsApp client status:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        }, { status: 500 });
    }
}
