import { sendOrderStatusUpdateWhatsApp } from '@/lib/whatsapp/order-notifications'
import { NextRequest, NextResponse } from 'next/server'

// Test endpoint for order status update notifications
export async function POST(req: NextRequest) {
    try {
        // Mock order status update data
        const mockOrderData = {
            id: 'test-order-123',
            display_id: 'ORD-2024-001',
            customer_name: 'Test Customer',
            customer_phone: '+251944113998',
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
                }
            ],
            delivery_address: '123 Main St, Anytown, ST 12345',
            status: 'preparing',
            created_at: new Date().toISOString()
        }

        const oldStatus = 'confirmed'
        const newStatus = 'preparing'

        console.log('Testing status update notification:', { mockOrderData, oldStatus, newStatus })

        // Send the status update notification
        const result = await sendOrderStatusUpdateWhatsApp(mockOrderData, oldStatus, newStatus)

        if (result.success) {
            return NextResponse.json({
                success: true,
                message: 'Status update notification sent successfully!',
                messageId: result.messageId,
                mockOrderData,
                oldStatus,
                newStatus
            })
        } else {
            return NextResponse.json({
                success: false,
                error: result.error
            }, { status: 500 })
        }

    } catch (error) {
        console.error('Test status update notification failed:', error)
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}
