import { sendBaileysMessage } from '@/lib/whatsapp/baileys-service'
import { NextRequest, NextResponse } from 'next/server'

// Test endpoint for sending invoice via WhatsApp
export async function POST(req: NextRequest) {
    try {
        console.log('🧪 Testing invoice sending via WhatsApp...')

        // Generate a test invoice first
        const receiptData = {
            customerName: 'Test Customer',
            customerEmail: 'test@example.com',
            orderId: 'ORD-2024-TEST',
            items: [
                {
                    name: 'Organic Apples',
                    quantity: 2,
                    price: 15.00
                },
                {
                    name: 'Fresh Spinach',
                    quantity: 3,
                    price: 5.00
                }
            ],
            total: 35.00,
            orderDate: new Date().toLocaleDateString(),
            orderTime: new Date().toLocaleTimeString(),
            storeName: 'Betty Organic',
            storeContact: '+251944113998'
        }

        console.log('📄 Generating invoice image...')

        // Generate invoice image
        const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/generate-receipt-image`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(receiptData)
        })

        if (!response.ok) {
            throw new Error(`Invoice generation failed: ${response.statusText}`)
        }

        const result = await response.json()

        if (!result.success || !result.imageBase64) {
            throw new Error('Failed to generate invoice image')
        }

        console.log('✅ Invoice image generated successfully')

        // Convert base64 to buffer
        const imageBuffer = Buffer.from(result.imageBase64, 'base64')

        // Create a temporary file for the image
        const fs = require('fs')
        const path = require('path')
        const tempDir = path.resolve('./temp')

        // Ensure temp directory exists
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true })
        }

        const tempImagePath = path.join(tempDir, `invoice-${Date.now()}.png`)
        fs.writeFileSync(tempImagePath, imageBuffer)

        console.log('📱 Sending invoice via WhatsApp...')

        // Send via WhatsApp
        const whatsappResult = await sendBaileysMessage({
            to: '+251944113998', // Send to admin for testing
            message: `📄 *Invoice - ${receiptData.orderId}*\n\n👤 Customer: ${receiptData.customerName}\n💰 Total: ETB ${receiptData.total.toFixed(2)}\n\n📧 Betty Organic Invoice`,
            mediaPath: tempImagePath
        })

        // Clean up temp file
        try {
            fs.unlinkSync(tempImagePath)
            console.log('🗑️ Temp invoice file cleaned up')
        } catch (e) {
            console.log('⚠️ Warning: Could not clean up temp file:', e)
        }

        if (whatsappResult.success) {
            return NextResponse.json({
                success: true,
                message: 'Invoice sent via WhatsApp successfully!',
                messageId: whatsappResult.messageId,
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
        console.error('❌ Test invoice sending failed:', error)
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}
