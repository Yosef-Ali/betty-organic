import { NextRequest, NextResponse } from 'next/server'
import { sendOrderNotificationWhatsApp } from '@/lib/whatsapp/order-notifications'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        // Test order data
        const testOrderData = {
            id: body.id || 'test-order-123',
            display_id: body.display_id || 'ORD-2025-001',
            customer_name: body.customer_name || 'Test Customer',
            customer_phone: body.customer_phone || '+251944113998',
            customer_email: body.customer_email || 'test@example.com',
            delivery_address: body.delivery_address || '123 Test Street, Addis Ababa',
            items: body.items || [
                {
                    product_name: 'Fresh Tomatoes',
                    quantity: 2,
                    price: 25.50
                },
                {
                    product_name: 'Organic Carrots',
                    quantity: 1,
                    price: 18.00
                }
            ],
            total_amount: body.total_amount || 43.50,
            delivery_cost: body.delivery_cost || 10.00,
            discount_amount: body.discount_amount || 0,
            created_at: new Date().toISOString(),
            status: body.status || 'pending',
            type: body.type || 'self_service'
        }

        console.log('📋 Testing WhatsApp order notification with data:', testOrderData)

        const result = await sendOrderNotificationWhatsApp(testOrderData)

        if (result.success) {
            return NextResponse.json({
                success: true,
                message: 'Test order notification sent successfully!',
                data: result
            })
        } else {
            return NextResponse.json({
                success: false,
                error: result.error
            }, { status: 500 })
        }
    } catch (error) {
        console.error('❌ Test notification error:', error)
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}
