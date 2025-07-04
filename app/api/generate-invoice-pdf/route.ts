import { NextRequest, NextResponse } from 'next/server';
import { generateOrderInvoicePDF } from '@/lib/utils/pdfGenerator';

// Ensure this route is always dynamic (no caching for on-demand generation)
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
    const startTime = Date.now();

    try {
        // Parse request data
        const invoiceData = await request.json();

        // Validate required data
        if (!invoiceData) {
            return NextResponse.json(
                { error: 'Invoice data is required' },
                {
                    status: 400,
                    headers: {
                        'Cache-Control': 'no-cache, no-store, must-revalidate',
                        'Pragma': 'no-cache',
                        'Expires': '0'
                    }
                }
            );
        }

        if (!invoiceData.orderId) {
            return NextResponse.json(
                { error: 'Order ID is required for invoice generation' },
                {
                    status: 400,
                    headers: {
                        'Cache-Control': 'no-cache, no-store, must-revalidate',
                        'Pragma': 'no-cache',
                        'Expires': '0'
                    }
                }
            );
        }

        console.log('🧾 [ON-DEMAND] Generating PDF invoice for:', invoiceData.orderId, {
            timestamp: new Date().toISOString(),
            customerName: invoiceData.customerName,
            itemCount: invoiceData.items?.length || 0
        });

        // Create receipt data using the proven pdfGenerator (same as sales page)
        const receiptData = {
            customerName: invoiceData.customerName || 'Valued Customer',
            customerEmail: invoiceData.customerEmail || '',
            orderId: invoiceData.orderId || 'BO-SALES-521982',
            items: (invoiceData.items || []).map((item: any) => ({
                name: item.name || 'Unknown Product',
                quantity: parseFloat(item.quantity?.toString().replace('g', '')) / 1000 || 1, // Convert back to kg for display
                price: item.price || 0
            })),
            total: invoiceData.totalAmount || 0,
            orderDate: invoiceData.orderDate || new Date().toLocaleDateString('en-US', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
            }),
            orderTime: invoiceData.orderTime || new Date().toLocaleTimeString('en-US', {
                hour: '2-digit', minute: '2-digit', hour12: true
            }),
            storeName: 'Betty Organic',
            storeContact: '+251944113998'
        };

        // Use the new clean invoice PDF generator (matches the modal design)
        const pdfBlob = await generateOrderInvoicePDF(receiptData);
        const pdfBuffer = Buffer.from(await pdfBlob.arrayBuffer());
        const pdfBase64 = pdfBuffer.toString('base64');

        const processingTime = Date.now() - startTime;

        console.log('✅ [ON-DEMAND] PDF invoice generated successfully!', {
            orderId: invoiceData.orderId,
            pdfSize: `${Math.round(pdfBuffer.length / 1024)}KB`,
            processingTime: `${processingTime}ms`,
            timestamp: new Date().toISOString()
        });

        return NextResponse.json({
            success: true,
            pdfBase64: pdfBase64,
            contentType: 'application/pdf',
            filename: `Betty_Organic_Invoice_${invoiceData.orderId}.pdf`,
            size: pdfBuffer.length,
            generatedAt: new Date().toISOString(),
            processingTime
        }, {
            status: 200,
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0',
                'Content-Type': 'application/json'
            }
        });

    } catch (error) {
        const processingTime = Date.now() - startTime;
        console.error('❌ [ON-DEMAND] Error generating PDF invoice:', {
            error: error instanceof Error ? error.message : 'Unknown error',
            processingTime: `${processingTime}ms`,
            timestamp: new Date().toISOString()
        });

        return NextResponse.json(
            {
                error: 'Failed to generate PDF invoice: ' + (error instanceof Error ? error.message : 'Unknown error'),
                success: false,
                timestamp: new Date().toISOString(),
                processingTime
            },
            {
                status: 500,
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0',
                    'Content-Type': 'application/json'
                }
            }
        );
    }
}
