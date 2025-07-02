import { NextRequest, NextResponse } from 'next/server';
import { sendBaileysMessage, getBaileysStatus } from '@/lib/whatsapp/baileys-service';

export async function POST(request: NextRequest) {
    try {
        const { phoneNumber, message } = await request.json();

        if (!phoneNumber) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Phone number is required',
                    status: getBaileysStatus()
                },
                { status: 400 }
            );
        }

        console.log('🧪 [TEST MESSAGE] Attempting to send test message to:', phoneNumber);
        const status = getBaileysStatus();
        console.log('🔍 [TEST MESSAGE] Current Baileys status:', status);

        const result = await sendBaileysMessage({
            to: phoneNumber,
            message: message || '🧪 Test message from Betty Organic - Baileys WhatsApp integration is working!'
        });

        return NextResponse.json({
            success: result.success,
            message: result.success
                ? 'Test message sent successfully!'
                : `Failed to send message: ${result.error}`,
            messageId: result.messageId,
            status: getBaileysStatus(),
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ [TEST MESSAGE] Error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                status: getBaileysStatus(),
                timestamp: new Date().toISOString()
            },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const status = getBaileysStatus();

        return NextResponse.json({
            success: true,
            message: 'Baileys status retrieved',
            status,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ [TEST STATUS] Error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            },
            { status: 500 }
        );
    }
}
