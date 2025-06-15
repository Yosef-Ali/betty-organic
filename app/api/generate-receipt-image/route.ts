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
            // Create a simple green and white invoice design
            imageBuffer = await sharp({
                create: {
                    width: 400,
                    height: 600,
                    channels: 3,
                    background: '#ffffff'
                }
            })
            .composite([
                {
                    input: Buffer.from(
                        `<svg width="400" height="600">
                            <rect width="400" height="80" fill="#4CAF50"/>
                            <text x="200" y="30" font-family="Arial" font-size="20" font-weight="bold" text-anchor="middle" fill="white">BETTY ORGANIC</text>
                            <text x="200" y="50" font-family="Arial" font-size="12" text-anchor="middle" fill="white">Fresh Organic Produce</text>
                            <text x="200" y="70" font-family="Arial" font-size="10" text-anchor="middle" fill="white">+251944113998</text>
                            
                            <text x="200" y="120" font-family="Arial" font-size="18" font-weight="bold" text-anchor="middle" fill="#333">INVOICE RECEIPT</text>
                            
                            <text x="20" y="160" font-family="Arial" font-size="12" fill="#333">Customer: ${receiptData.customerName || 'Valued Customer'}</text>
                            <text x="20" y="180" font-family="Arial" font-size="12" fill="#333">Order ID: ${receiptData.orderId || 'N/A'}</text>
                            <text x="20" y="200" font-family="Arial" font-size="12" fill="#333">Date: ${receiptData.orderDate || 'N/A'}</text>
                            
                            <rect x="0" y="220" width="400" height="30" fill="#4CAF50"/>
                            <text x="20" y="240" font-family="Arial" font-size="14" font-weight="bold" fill="white">ITEMS</text>
                            
                            ${receiptData.items?.map((item: any, index: number) => `
                                <text x="20" y="${270 + (index * 20)}" font-family="Arial" font-size="11" fill="#333">${item.name || 'Item'}</text>
                                <text x="250" y="${270 + (index * 20)}" font-family="Arial" font-size="11" fill="#666">${((item.quantity || 0) * 1000).toFixed(0)}g</text>
                                <text x="350" y="${270 + (index * 20)}" font-family="Arial" font-size="11" fill="#333">ETB ${(item.price || 0).toFixed(2)}</text>
                            `).join('') || ''}
                            
                            <rect x="0" y="${290 + (itemsCount * 20)}" width="400" height="40" fill="#4CAF50"/>
                            <text x="200" y="${315 + (itemsCount * 20)}" font-family="Arial" font-size="16" font-weight="bold" text-anchor="middle" fill="white">TOTAL: ETB ${(receiptData.total || 0).toFixed(2)}</text>
                            
                            <text x="200" y="${360 + (itemsCount * 20)}" font-family="Arial" font-size="12" text-anchor="middle" fill="#4CAF50">Thank you for choosing Betty Organic!</text>
                            <text x="200" y="${380 + (itemsCount * 20)}" font-family="Arial" font-size="10" text-anchor="middle" fill="#666">Fresh • Organic • Healthy</text>
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