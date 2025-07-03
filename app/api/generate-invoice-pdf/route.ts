import { NextRequest, NextResponse } from 'next/server';
import jsPDF from 'jspdf';

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

        // Create new PDF document - mobile-friendly portrait format
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const pageWidth = doc.internal.pageSize.width;
        const margin = 20;
        const contentWidth = pageWidth - (margin * 2);

        // Set up fonts and colors to match the image exactly
        doc.setFont('helvetica');

        // Header - Company Title (exactly like the image)
        let yPos = 25;
        doc.setFontSize(28);
        doc.setTextColor(60, 70, 100); // Dark blue-gray color
        doc.text('Betty Organic', pageWidth / 2, yPos, { align: 'center' });

        yPos += 10;
        doc.setFontSize(14);
        doc.setTextColor(120, 130, 140); // Light gray
        doc.text('Fresh Organic Fruits & Vegetables', pageWidth / 2, yPos, { align: 'center' });

        yPos += 8;
        doc.setFontSize(12);
        doc.text('Thank you for your order!', pageWidth / 2, yPos, { align: 'center' });

        // Customer and Order Info Section (like the gray box in image)
        yPos += 20;
        doc.setFillColor(248, 249, 250); // Light gray background
        doc.setDrawColor(229, 231, 235); // Border color
        doc.rect(margin, yPos - 5, contentWidth, 35, 'FD'); // Fill and Draw

        // Customer Info (left side)
        yPos += 8;
        doc.setFontSize(14);
        doc.setTextColor(26, 26, 26); // Dark text
        doc.text(`Customer: ${invoiceData.customerName || 'Yosef Alemu'}`, margin + 5, yPos);

        // Order ID (right side)
        doc.text(`Order ID: ${invoiceData.orderId || 'BO-SALES-965053'}`, pageWidth - margin - 5, yPos, { align: 'right' });

        yPos += 8;
        doc.setFontSize(11);
        doc.setTextColor(102, 102, 102); // Medium gray
        doc.text(`(${invoiceData.customerEmail || 'yosefalemu007@gmail.com'})`, margin + 5, yPos);

        // Order Items Section
        yPos += 25;
        doc.setFontSize(16);
        doc.setTextColor(26, 26, 26);
        doc.text('Order Items:', margin, yPos);

        // Items list (exactly like the image layout)
        yPos += 15;
        if (invoiceData.items && invoiceData.items.length > 0) {
            invoiceData.items.forEach((item: any) => {
                doc.setFontSize(12);
                doc.setTextColor(26, 26, 26);

                // Item name and quantity on the left
                const itemText = `${item.name || 'Unknown Product'} (${item.quantity || 1000}g)`;
                doc.text(itemText, margin, yPos);

                // Price on the right
                doc.text(`ETB ${(item.price || 0).toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' });

                yPos += 12;
            });
        }

        // Total Amount Section (gray box like in image)
        yPos += 10;
        doc.setFillColor(248, 249, 250);
        doc.setDrawColor(229, 231, 235);
        doc.rect(margin, yPos - 5, contentWidth, 20, 'FD');

        yPos += 8;
        doc.setFontSize(16);
        doc.setTextColor(26, 26, 26);
        doc.text('Total Amount:', margin + 5, yPos);
        doc.text(`ETB ${(invoiceData.totalAmount || 0).toFixed(2)}`, pageWidth - margin - 5, yPos, { align: 'right' });

        // Order Barcode Section (like in the image)
        yPos += 35;
        doc.setFontSize(12);
        doc.setTextColor(156, 163, 175); // Light gray
        doc.text('ORDER BARCODE', pageWidth / 2, yPos, { align: 'center' });

        // Barcode box
        yPos += 10;
        const barcodeWidth = 60;
        const barcodeHeight = 20;
        const barcodeX = (pageWidth - barcodeWidth) / 2;

        doc.setDrawColor(26, 26, 26);
        doc.setLineWidth(0.5);
        doc.rect(barcodeX, yPos, barcodeWidth, barcodeHeight);

        // Simple barcode lines (simulate barcode appearance)
        doc.setLineWidth(0.8);
        for (let i = 0; i < 30; i++) {
            const x = barcodeX + 2 + (i * 1.8);
            const lineHeight = Math.random() > 0.5 ? barcodeHeight - 4 : barcodeHeight - 8;
            doc.line(x, yPos + 2, x, yPos + 2 + lineHeight);
        }

        yPos += barcodeHeight + 8;
        doc.setFontSize(14);
        doc.setTextColor(26, 26, 26);
        doc.text(invoiceData.orderId || 'BO-SALES-965053', pageWidth / 2, yPos, { align: 'center' });

        yPos += 5;
        doc.setFontSize(10);
        doc.setTextColor(156, 163, 175);
        doc.text('Scan for order verification', pageWidth / 2, yPos, { align: 'center' });

        // Order Details Section
        yPos += 25;
        doc.setFontSize(16);
        doc.setTextColor(26, 26, 26);
        doc.text('Order Details', pageWidth / 2, yPos, { align: 'center' });

        yPos += 12;
        doc.setFontSize(12);
        doc.setTextColor(102, 102, 102);
        doc.text(`Date: ${invoiceData.orderDate || 'Sunday, June 15, 2025'}`, pageWidth / 2, yPos, { align: 'center' });

        yPos += 8;
        doc.text(`Time: ${invoiceData.orderTime || '07:12 PM'}`, pageWidth / 2, yPos, { align: 'center' });

        // Footer (exactly like the image)
        yPos += 30;
        doc.setFontSize(14);
        doc.setTextColor(102, 102, 102);
        doc.text('Fresh • Organic • Healthy', pageWidth / 2, yPos, { align: 'center' });

        // Generate PDF buffer
        const pdfBuffer = doc.output('arraybuffer');
        const pdfBase64 = Buffer.from(pdfBuffer).toString('base64');

        const processingTime = Date.now() - startTime;

        console.log('✅ [ON-DEMAND] PDF invoice generated successfully!', {
            orderId: invoiceData.orderId,
            pdfSize: `${Math.round(pdfBuffer.byteLength / 1024)}KB`,
            processingTime: `${processingTime}ms`,
            timestamp: new Date().toISOString()
        });

        return NextResponse.json({
            success: true,
            pdfBase64,
            contentType: 'application/pdf',
            filename: `Betty_Organic_Invoice_${invoiceData.orderId}.pdf`,
            size: pdfBuffer.byteLength,
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
