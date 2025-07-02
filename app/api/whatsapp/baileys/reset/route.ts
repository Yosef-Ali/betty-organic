import { NextRequest, NextResponse } from 'next/server';
import { resetBaileysConnection } from '@/lib/whatsapp/baileys-service';

export async function POST(request: NextRequest) {
    try {
        console.log('🔄 [BAILEYS RESET] Resetting Baileys connection');
        const result = await resetBaileysConnection();

        return NextResponse.json({
            success: result.success,
            message: result.message,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ [BAILEYS RESET] Error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        }, { status: 500 });
    }
}
