import { NextResponse } from 'next/server';
import { logoutWhatsAppClient, initializeWhatsAppClient } from '@/lib/whatsapp/webjs-service';

export async function POST() {
    try {
        console.log('🔄 Restarting WhatsApp connection...');

        // First, logout and clean up the current client
        await logoutWhatsAppClient();

        // Wait a moment for cleanup
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Start fresh initialization
        initializeWhatsAppClient().catch(error => {
            console.error('[WHATSAPP_RESTART_API] Async initialization error:', error);
        });

        return NextResponse.json({
            success: true,
            message: 'WhatsApp connection restarted. Check status for new QR code.',
            restarted: true
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        console.error(`[WHATSAPP_RESTART_API] Error: ${errorMessage}`, error);
        return NextResponse.json({ success: false, message: 'Failed to restart WhatsApp connection' }, { status: 500 });
    }
}
