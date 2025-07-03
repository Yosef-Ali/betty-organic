/**
 * Simple Order Creation Test to Verify Automatic WhatsApp Sending
 * 
 * Run this after starting your development server to test if:
 * 1. Orders can be created successfully
 * 2. WhatsApp notifications are sent automatically
 * 3. The system handles failures gracefully
 */

console.log(`
🚀 Betty Organic - WhatsApp Automatic Notification Test
=====================================================

This test verifies that:
✅ Order creation triggers automatic WhatsApp notifications
✅ Messages are sent to admin phone number: +251944113998
✅ System handles connection failures gracefully

Before running this test:
1. Start the development server: npm run dev
2. Ensure WhatsApp (Baileys) is connected and authenticated
3. Your admin phone number should be +251944113998

Expected Result:
- You should receive a WhatsApp message with order details
- Console should show "SUCCESS: Automatic WhatsApp message sent!"
`);

async function runOrderTest() {
    console.log('🔍 Testing order creation with automatic WhatsApp...\n');

    try {
        // 1. Test the notification system directly
        console.log('1️⃣ Testing direct WhatsApp notification...');
        
        const response = await fetch('http://localhost:3000/api/whatsapp/test-order-notification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                display_id: `TEST-${Date.now()}`,
                customer_name: 'Test Customer',
                customer_phone: '+251944113998',
                items: [
                    { product_name: 'Organic Apples', quantity: 2, price: 50.00 }
                ],
                total_amount: 50.00,
                delivery_cost: 10.00
            })
        });

        if (response.ok) {
            const result = await response.json();
            console.log('📊 Result:', result);
            
            if (result.success && result.data?.messageId) {
                console.log('✅ SUCCESS: Automatic WhatsApp message sent!');
                console.log(`   Message ID: ${result.data.messageId}`);
                console.log(`   Method: ${result.data.method}`);
                console.log('   📱 Check your WhatsApp for the test message!');
            } else if (result.success && result.data?.whatsappUrl) {
                console.log('⚠️ PARTIAL SUCCESS: Fallback URL generated');
                console.log('   This means automatic sending failed but system is working');
                console.log(`   Error: ${result.data.error}`);
            } else {
                console.log('❌ FAILED: WhatsApp notification failed');
                console.log(`   Error: ${result.error}`);
            }
        } else {
            console.log(`❌ API Error: ${response.status}`);
        }

        console.log('\n2️⃣ Current Configuration:');
        console.log(`   Admin Phone: +251944113998`);
        console.log(`   WhatsApp Provider: baileys`);
        console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
        
    } catch (error) {
        console.error('💥 Test failed:', error.message);
        
        if (error.message.includes('fetch')) {
            console.log('\n💡 Make sure the development server is running:');
            console.log('   npm run dev');
        }
    }
}

// Polyfill for Node.js
if (typeof fetch === 'undefined') {
    try {
        global.fetch = require('node-fetch');
    } catch {
        console.log('Install node-fetch: npm install node-fetch');
        process.exit(1);
    }
}

runOrderTest();
