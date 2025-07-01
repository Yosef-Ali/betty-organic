import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

export async function POST(request: NextRequest) {
    try {
        const receiptData = await request.json();

        if (!receiptData) {
            return NextResponse.json(
                { error: 'Receipt data is required' },
                { status: 400 }
            );
        }

        console.log('🖼️ Generating simple receipt image for:', receiptData.orderId);

        // Create a simple but effective image using Sharp's text rendering
        const width = 400;
        const baseHeight = 600;
        const itemsCount = receiptData.items?.length || 0;
        const height = baseHeight + (itemsCount * 30);

        // Create base white canvas
        const canvas = sharp({
            create: {
                width,
                height,
                channels: 3,
                background: '#ffffff'
            }
        });

        // Create text overlay with invoice information
        const invoiceText = `
BETTY ORGANIC
Fresh Organic Produce
Phone: +251944113998

INVOICE RECEIPT

Customer: ${receiptData.customerName || 'Valued Customer'}
Order ID: ${receiptData.orderId || 'N/A'}
Date: ${receiptData.orderDate || 'N/A'}
Time: ${receiptData.orderTime || 'N/A'}

ITEMS:
${receiptData.items?.map((item: any, index: number) => 
    `${index + 1}. ${item.name || 'Item'} - ${((item.quantity || 0) * 1000).toFixed(0)}g - ETB ${(item.price || 0).toFixed(2)}`
).join('\n') || 'No items'}

TOTAL: ETB ${(receiptData.total || 0).toFixed(2)}

Next Steps:
- Your fresh produce is being prepared
- We'll contact you for delivery details
- Estimated delivery: Within 24 hours

Thank you for choosing Betty Organic!
Fresh • Organic • Healthy
        `.trim();

        // For now, let's create a simple solid color image with text overlay
        // This is a reliable fallback that will definitely work
        let imageBuffer;
        
        try {
            // Create a clean gray/black invoice design matching the original
            const dynamicHeight = 1100 + ((receiptData.items?.length || 0) * 40);
            imageBuffer = await sharp({
                create: {
                    width: 800,
                    height: dynamicHeight,
                    channels: 3,
                    background: '#ffffff'
                }
            })
            .composite([
                {
                    input: Buffer.from(
                        `<svg width="800" height="${dynamicHeight}" xmlns="http://www.w3.org/2000/svg">
                            <!-- White background -->
                            <rect width="800" height="${dynamicHeight}" fill="#ffffff"/>
                            
                            <!-- Header -->
                            <text x="400" y="80" font-family="Arial, sans-serif" font-size="48" font-weight="bold" text-anchor="middle" fill="#1a1a1a">Betty Organic</text>
                            <text x="400" y="120" font-family="Arial, sans-serif" font-size="20" text-anchor="middle" fill="#666666">Fresh Organic Fruits &amp; Vegetables</text>
                            <text x="400" y="160" font-family="Arial, sans-serif" font-size="18" text-anchor="middle" fill="#666666">Thank you for your order!</text>
                            
                            <!-- Customer and Order Info Box -->
                            <rect x="50" y="220" width="700" height="120" fill="#f8f9fa" stroke="#e5e7eb" stroke-width="1"/>
                            <text x="80" y="260" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#1a1a1a">Customer: ${receiptData.customerName || 'Valued Customer'}</text>
                            <text x="580" y="260" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#1a1a1a">Order ID: ${receiptData.orderId || 'N/A'}</text>
                            <text x="80" y="300" font-family="Arial, sans-serif" font-size="16" fill="#666666">(${receiptData.customerEmail || 'customer@email.com'})</text>
                            
                            <!-- Order Items Header -->
                            <text x="80" y="420" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="#1a1a1a">Order Items:</text>
                            
                            <!-- Items List -->
                            ${receiptData.items?.map((item: any, index: number) => `
                                <text x="80" y="${480 + (index * 40)}" font-family="Arial, sans-serif" font-size="18" fill="#1a1a1a">${item.name || 'Unknown Product'} (${item.quantity || 0}g)</text>
                                <text x="650" y="${480 + (index * 40)}" font-family="Arial, sans-serif" font-size="18" fill="#1a1a1a" text-anchor="end">ETB ${(item.price || 0).toFixed(2)}</text>
                            `).join('') || '<text x="80" y="480" font-family="Arial, sans-serif" font-size="18" fill="#666666">No items</text>'}
                            
                            <!-- Total Amount Box -->
                            <rect x="50" y="${520 + ((receiptData.items?.length || 0) * 40)}" width="700" height="80" fill="#f8f9fa" stroke="#e5e7eb" stroke-width="1"/>
                            <text x="80" y="${560 + ((receiptData.items?.length || 0) * 40)}" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="#1a1a1a">Total Amount:</text>
                            <text x="650" y="${560 + ((receiptData.items?.length || 0) * 40)}" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="#1a1a1a" text-anchor="end">ETB ${(receiptData.total || 0).toFixed(2)}</text>
                            
                            <!-- Barcode Section -->
                            <text x="400" y="${680 + ((receiptData.items?.length || 0) * 40)}" font-family="Arial, sans-serif" font-size="16" text-anchor="middle" fill="#9ca3af">ORDER BARCODE</text>
                            
                            <!-- Simple barcode representation -->
                            <rect x="280" y="${700 + ((receiptData.items?.length || 0) * 40)}" width="240" height="80" fill="#ffffff" stroke="#1a1a1a" stroke-width="2"/>
                            <g fill="#1a1a1a">
                                ${Array.from({length: 40}, (_, i) => 
                                    `<rect x="${290 + (i * 5)}" y="${710 + ((receiptData.items?.length || 0) * 40)}" width="${Math.random() > 0.5 ? '3' : '1'}" height="60"/>`
                                ).join('')}
                            </g>
                            
                            <text x="400" y="${820 + ((receiptData.items?.length || 0) * 40)}" font-family="Arial, sans-serif" font-size="18" font-weight="bold" text-anchor="middle" fill="#1a1a1a">${receiptData.orderId || 'ORDER-ID'}</text>
                            <text x="400" y="${845 + ((receiptData.items?.length || 0) * 40)}" font-family="Arial, sans-serif" font-size="14" text-anchor="middle" fill="#9ca3af">Scan for order verification</text>
                            
                            <!-- Order Details -->
                            <text x="400" y="${920 + ((receiptData.items?.length || 0) * 40)}" font-family="Arial, sans-serif" font-size="24" font-weight="bold" text-anchor="middle" fill="#1a1a1a">Order Details</text>
                            <text x="400" y="${960 + ((receiptData.items?.length || 0) * 40)}" font-family="Arial, sans-serif" font-size="18" text-anchor="middle" fill="#666666">Date: ${receiptData.orderDate || 'N/A'}</text>
                            <text x="400" y="${990 + ((receiptData.items?.length || 0) * 40)}" font-family="Arial, sans-serif" font-size="18" text-anchor="middle" fill="#666666">Time: ${receiptData.orderTime || 'N/A'}</text>
                            
                            <!-- Footer -->
                            <text x="400" y="${1080 + ((receiptData.items?.length || 0) * 40)}" font-family="Arial, sans-serif" font-size="20" text-anchor="middle" fill="#666666">Fresh • Organic • Healthy</text>
                        </svg>`
                    ),
                    top: 0,
                    left: 0
                }
            ])
            .png({ quality: 90 })
            .toBuffer();

        } catch (svgError) {
            console.warn('SVG generation failed, creating simple colored image:', svgError);
            
            // Fallback: Create a simple solid color image with basic info
            imageBuffer = await sharp({
                create: {
                    width: 400,
                    height: 300,
                    channels: 3,
                    background: '#4CAF50'  // Betty Organic green
                }
            })
            .composite([
                {
                    input: Buffer.from(`<svg width="400" height="300">
                        <rect width="400" height="300" fill="#4CAF50"/>
                        <text x="200" y="50" font-family="Arial" font-size="24" font-weight="bold" text-anchor="middle" fill="white">BETTY ORGANIC</text>
                        <text x="200" y="80" font-family="Arial" font-size="14" text-anchor="middle" fill="white">INVOICE RECEIPT</text>
                        <text x="200" y="120" font-family="Arial" font-size="12" text-anchor="middle" fill="white">Order: ${receiptData.orderId || 'N/A'}</text>
                        <text x="200" y="140" font-family="Arial" font-size="12" text-anchor="middle" fill="white">Customer: ${receiptData.customerName || 'Customer'}</text>
                        <text x="200" y="180" font-family="Arial" font-size="16" font-weight="bold" text-anchor="middle" fill="white">TOTAL: ETB ${(receiptData.total || 0).toFixed(2)}</text>
                        <text x="200" y="220" font-family="Arial" font-size="11" text-anchor="middle" fill="white">Thank you for choosing Betty Organic!</text>
                        <text x="200" y="240" font-family="Arial" font-size="10" text-anchor="middle" fill="white">Fresh • Organic • Healthy</text>
                        <text x="200" y="270" font-family="Arial" font-size="10" text-anchor="middle" fill="white">+251944113998</text>
                    </svg>`),
                    top: 0,
                    left: 0
                }
            ])
            .png({ quality: 90 })
            .toBuffer();
        }

        // Convert to base64
        const imageBase64 = imageBuffer.toString('base64');

        console.log('✅ Receipt image generated successfully!', {
            orderId: receiptData.orderId,
            imageSize: `${Math.round(imageBuffer.length / 1024)}KB`,
            base64Length: imageBase64.length
        });

        return NextResponse.json({
            success: true,
            imageBase64,
            contentType: 'image/png',
            filename: `Betty_Organic_Receipt_${receiptData.orderId}.png`,
            method: 'sharp_simple',
            size: imageBuffer.length,
            textContent: invoiceText // Also provide text version
        });

    } catch (error) {
        console.error('Error generating receipt image:', error);
        
        // Final fallback: Return a base64 encoded simple image
        try {
            // Create minimal working image
            const fallbackBuffer = await sharp({
                create: {
                    width: 300,
                    height: 200,
                    channels: 3,
                    background: '#4CAF50'
                }
            })
            .png()
            .toBuffer();

            return NextResponse.json({
                success: true,
                imageBase64: fallbackBuffer.toString('base64'),
                contentType: 'image/png',
                filename: `Betty_Organic_Receipt_${receiptData.orderId || 'unknown'}.png`,
                method: 'fallback',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        } catch (fallbackError) {
            return NextResponse.json(
                { error: 'Failed to generate any receipt image: ' + (error instanceof Error ? error.message : 'Unknown error') },
                { status: 500 }
            );
        }
    }
}