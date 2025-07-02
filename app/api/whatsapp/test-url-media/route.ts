import { sendBaileysMessage } from '@/lib/whatsapp/baileys-service'
import { NextRequest, NextResponse } from 'next/server'

// Test endpoint for URL-based media sending (like from orders table)
export async function POST(req: NextRequest) {
    try {
        console.log('🧪 Testing URL-based media sending...')

        // First generate an image URL (simulating orders table process)
        const receiptData = {
            customerName: 'Test Customer - URL Media',
            customerEmail: 'test@example.com',
            orderId: 'ORD-URL-TEST',
            items: [
                {
                    name: 'Organic Apples',
                    quantity: 2,
                    price: 15.00
                }
            ],
            total: 30.00,
            orderDate: new Date().toLocaleDateString(),
            orderTime: new Date().toLocaleTimeString(),
            storeName: 'Betty Organic',
            storeContact: '+251944113998'
        }

        console.log('📄 Generating invoice image...')

        // Generate invoice image
        const imageResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/generate-receipt-image`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(receiptData)
        })

        if (!imageResponse.ok) {
            throw new Error(`Invoice generation failed: ${imageResponse.statusText}`)
        }

        const imageResult = await imageResponse.json()

        if (!imageResult.success || !imageResult.imageBase64) {
            throw new Error('Failed to generate invoice image')
        }

        console.log('✅ Invoice image generated successfully')

        // Upload to temp storage
        const uploadResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/temp-image`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                imageData: imageResult.imageBase64,
                filename: `Betty_Organic_Receipt_${receiptData.orderId}.png`,
                expiresIn: 600
            })
        })

        if (!uploadResponse.ok) {
            throw new Error(`Failed to upload image: ${uploadResponse.statusText}`)
        }

        const uploadResult = await uploadResponse.json()
        let imageUrl = uploadResult.url

        // Convert to external URL if needed
        const externalBaseUrl = process.env.NEXT_PUBLIC_NGROK_URL || 'http://localhost:3000'
        if (imageUrl && imageUrl.includes('localhost') && externalBaseUrl !== 'http://localhost:3000') {
            imageUrl = imageUrl.replace('http://localhost:3000', externalBaseUrl)
        }

        console.log('📱 Testing URL-based media sending via Baileys...')
        console.log('🔗 Image URL:', imageUrl)

        // Test sending via Baileys using URL as mediaPath (this is what orders table does)
        const whatsappResult = await sendBaileysMessage({
            to: '+251944113998',
            message: `📄 *Test Invoice - URL Media*\n\n👤 Customer: ${receiptData.customerName}\n💰 Total: ETB ${receiptData.total.toFixed(2)}\n\n📧 Betty Organic Test Invoice`,
            mediaPath: imageUrl // This simulates how orders table passes URLs
        })

        if (whatsappResult.success) {
            return NextResponse.json({
                success: true,
                message: 'URL-based media sent via WhatsApp successfully!',
                messageId: whatsappResult.messageId,
                imageUrl,
                invoiceData: {
                    orderId: receiptData.orderId,
                    customer: receiptData.customerName,
                    total: receiptData.total
                }
            })
        } else {
            return NextResponse.json({
                success: false,
                error: whatsappResult.error || 'Failed to send via WhatsApp'
            }, { status: 500 })
        }

    } catch (error) {
        console.error('❌ URL media test failed:', error)
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}
