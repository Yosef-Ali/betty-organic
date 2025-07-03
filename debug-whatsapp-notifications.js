#!/usr/bin/env node

/**
 * Debug WhatsApp Notification System
 * This script tests the WhatsApp notification system directly without requiring a running server
 */

// Mock the server environment
process.env.NODE_ENV = 'development';
process.env.ADMIN_WHATSAPP_NUMBER = '+251944113998';

async function debugWhatsAppNotifications() {
    console.log('🔍 Debugging WhatsApp Notification System...\n');

    try {
        // First, check environment variables
        console.log('1️⃣ Environment Variables:');
        console.log('   ADMIN_WHATSAPP_NUMBER:', process.env.ADMIN_WHATSAPP_NUMBER);
        console.log('   NODE_ENV:', process.env.NODE_ENV);

        // Test the Baileys service directly
        console.log('\n2️⃣ Testing Baileys Service...');
        const { getBaileysStatus, sendBaileysMessage } = require('./lib/whatsapp/baileys-service.ts');

        const status = getBaileysStatus();
        console.log('📊 Baileys Status:', {
            isConnected: status.isConnected,
            isConnecting: status.isConnecting,
            hasClient: status.hasClient,
            attempts: status.attempts,
            canRetry: status.canRetry
        });

        if (!status.isConnected) {
            console.log('❌ Baileys not connected. This is the main issue!');
            console.log('💡 Solution: Connect WhatsApp first via the admin panel.');
            return;
        }

        // Test sending a message directly
        console.log('\n3️⃣ Testing Direct Message Send...');
        const testResult = await sendBaileysMessage({
            to: '+251944113998',
            message: '🧪 Direct test from debug script - Betty Organic WhatsApp is working!'
        });

        console.log('📊 Direct Test Result:', testResult);

        if (testResult.success) {
            console.log('✅ Direct messaging works! Problem is not in the sending logic.');
        } else {
            console.log('❌ Direct messaging failed:', testResult.error);
        }

        // Test the order notification function
        console.log('\n4️⃣ Testing Order Notification Function...');
        const { sendOrderNotificationWhatsApp } = require('./lib/whatsapp/order-notifications.ts');

        const testOrderData = {
            id: 'debug-test-' + Date.now(),
            display_id: 'DEBUG-' + Date.now().toString().slice(-6),
            customer_name: 'Debug Test Customer',
            customer_phone: '+251944113998',
            customer_email: 'debug@test.com',
            items: [
                {
                    product_name: 'Debug Test Product',
                    quantity: 1,
                    price: 25.00
                }
            ],
            total_amount: 25.00,
            delivery_cost: 5.00,
            discount_amount: 0,
            created_at: new Date().toISOString(),
            status: 'pending',
            type: 'store'
        };

        const notificationResult = await sendOrderNotificationWhatsApp(testOrderData);
        console.log('📊 Notification Result:', notificationResult);

        if (notificationResult.success) {
            console.log('✅ Order notification works perfectly!');
            console.log('   Message ID:', notificationResult.messageId);
        } else {
            console.log('❌ Order notification failed:', notificationResult.error);
        }

    } catch (error) {
        console.error('💥 Debug Error:', error.message);

        if (error.message.includes('Cannot find module')) {
            console.log('\n💡 Module Error: This seems to be a TypeScript import issue.');
            console.log('   The WhatsApp system should work fine in the actual app.');
        }
    }

    console.log('\n🎯 Debug Summary:');
    console.log('- Check if Baileys is connected in the admin panel');
    console.log('- Ensure ADMIN_WHATSAPP_NUMBER is set correctly');
    console.log('- Test order creation in the app to trigger notifications');
}

debugWhatsAppNotifications().catch(console.error);
