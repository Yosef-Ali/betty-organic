#!/usr/bin/env node

// Simple test script to test WhatsApp Web.js directly
// This bypasses the Next.js API routes and tests the service directly

const { testWhatsAppWebJsConnection } = require('./lib/whatsapp/webjs-service');

async function testWhatsApp() {
    console.log('🧪 Testing WhatsApp Web.js directly...');
    console.log('📞 Testing with phone number: +251944113998');

    try {
        const result = await testWhatsAppWebJsConnection('+251944113998');

        console.log('\n📋 Test Result:');
        console.log('Success:', result.success);
        console.log('Message:', result.message);
        if (result.messageId) {
            console.log('Message ID:', result.messageId);
        }

        if (result.success) {
            console.log('\n✅ WhatsApp Web.js test PASSED!');
            console.log('🎉 Your automatic WhatsApp messaging is working!');
        } else {
            console.log('\n❌ WhatsApp Web.js test FAILED');
            console.log('💡 Check the logs above for details');
        }
    } catch (error) {
        console.error('\n💥 Test Error:', error);
        console.log('\n❌ WhatsApp Web.js test FAILED with exception');
    }
}

testWhatsApp();
