import { NextRequest, NextResponse } from 'next/server';
import { sendImageInvoiceWhatsApp } from '@/lib/whatsapp/invoices';

export async function POST(request: NextRequest) {
    try {
        console.log('🧪 TEST: Starting invoice send test with Baileys...');
        
        // Test data for invoice
        const testInvoiceData = {
            customerPhone: '+251944113998', // Test phone number
            customerName: 'Test Customer',
            orderId: 'TEST-' + Date.now(),
            items: [
                {
                    name: 'Test Organic Tomatoes',
                    quantity: 2,
                    price: 150.00
                },
                {
                    name: 'Test Organic Lettuce',
                    quantity: 1,
                    price: 80.00
                }
            ],
            total: 230.00,
            orderDate: new Date().toLocaleDateString(),
            orderTime: new Date().toLocaleTimeString(),
            storeName: 'Betty Organic',
            storeContact: '+251944113998'
        };

        console.log('📋 Test invoice data:', testInvoiceData);

        // Send the invoice via WhatsApp
        const result = await sendImageInvoiceWhatsApp(testInvoiceData);

        console.log('📬 WhatsApp send result:', result);

        return NextResponse.json({
            success: true,
            message: 'Test invoice processed',
            result: result,
            testData: testInvoiceData
        });

    } catch (error) {
        console.error('❌ Test invoice error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}