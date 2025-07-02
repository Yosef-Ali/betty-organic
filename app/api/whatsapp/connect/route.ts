import { NextResponse } from 'next/server';
import { initializeWhatsAppClient } from '@/lib/whatsapp/webjs-service';

export async function POST() {
    try {
        // Start the initialization process asynchronously without waiting for completion
        initializeWhatsAppClient().catch(error => {
            console.error('[WHATSAPP_CONNECT_API] Async initialization error:', error);
        });

        // Return immediately to prevent timeout
        return NextResponse.json({
            success: true,
            message: 'WhatsApp initialization started. Check status for QR code.',
            initializing: true
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        console.error(`[WHATSAPP_CONNECT_API] Error: ${errorMessage}`, error);
        return NextResponse.json({ success: false, message: 'Failed to start WhatsApp connection' }, { status: 500 });
    }
}
