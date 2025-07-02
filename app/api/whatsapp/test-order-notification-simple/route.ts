import { sendOrderNotificationWhatsApp } from '@/lib/whatsapp/order-notifications'
import { NextRequest, NextResponse } from 'next/server'

// Simple test endpoint without authentication for testing order notifications
export async function POST(req: NextRequest) {
    try {
        // Mock order data for testing
        const mockOrder = {
            id: 'test-order-123',
            display_id: 'ORD-2024-001',
            customer_name: 'Test Customer',
            customer_phone: '+251944113998', // Use your WhatsApp number for testing
            customer_email: 'test@example.com',
            type: 'delivery',
            total_amount: 35.00,
            delivery_cost: 10.50,
            discount_amount: 0,
            items: [
                {
                    product_name: 'Organic Apples',
                    quantity: 2,
                    price: 15.00
                },
                {
                    product_name: 'Fresh Spinach',
                    quantity: 4,
                    price: 5.00
                }
            ],
            delivery_address: '123 Main St, Anytown, ST 12345',
            status: 'confirmed',
            created_at: new Date().toISOString()
        }

        console.log('Testing order notification with mock data:', mockOrder)

        // Send the notification
        const result = await sendOrderNotificationWhatsApp(mockOrder)

        if (result.success) {
            return NextResponse.json({
                success: true,
                message: 'Order notification sent successfully!',
                messageId: result.messageId,
                mockOrder
            })
        } else {
            return NextResponse.json({
                success: false,
                error: result.error
            }, { status: 500 })
        }

    } catch (error) {
        console.error('Test order notification failed:', error)
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}
