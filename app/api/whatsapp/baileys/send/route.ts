import { NextRequest, NextResponse } from 'next/server';
import { sendBaileysMessage, getBaileysStatus } from '@/lib/whatsapp/baileys-service';

export async function POST(request: NextRequest) {
    try {
        const { to, message } = await request.json();

        if (!to || !message) {
            return NextResponse.json({
                success: false,
                error: 'Missing required fields: to, message'
            }, { status: 400 });
        }

        // Check if Baileys is connected
        const status = getBaileysStatus();
        if (!status.isConnected) {
            return NextResponse.json({
                success: false,
                error: 'WhatsApp not connected. Please scan QR code first.'
            }, { status: 400 });
        }

        console.log('📱 Sending message to:', to);
        console.log('💬 Message:', message);

        const result = await sendBaileysMessage({ to, message });

        if (result.success) {
            console.log('✅ Message sent successfully');
            return NextResponse.json({
                success: true,
                messageId: result.messageId,
                message: 'Message sent successfully'
            });
        } else {
            console.error('❌ Failed to send message:', result.error);
            return NextResponse.json({
                success: false,
                error: result.error || 'Failed to send message'
            }, { status: 500 });
        }

    } catch (error) {
        console.error('Error in send endpoint:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Internal server error'
        }, { status: 500 });
    }
}
