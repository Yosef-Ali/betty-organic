#!/usr/bin/env node

// Test the WhatsApp API directly
async function testWhatsAppAPI() {
    console.log('🧪 Testing WhatsApp API directly...\n');

    const testData = {
        phoneNumber: '+251912345678'  // Replace with actual admin phone number
    };

    try {
        const response = await fetch('http://localhost:3000/api/whatsapp/test', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testData)
        });

        console.log('📡 Response Status:', response.status);
        console.log('📡 Response OK:', response.ok);

        const result = await response.json();
        console.log('📡 Response Body:', JSON.stringify(result, null, 2));

        if (result.success) {
            console.log('\n✅ Test API call succeeded!');

            if (result.whatsappUrl) {
                console.log('📱 WhatsApp URL generated:', result.whatsappUrl);
                console.log('\n💡 This URL should open WhatsApp with the test message pre-filled.');
                console.log('   You can copy and paste it into your browser to test manually.');
            } else if (result.messageId) {
                console.log('📨 Message ID:', result.messageId);
                console.log('\n💡 Message was sent automatically via configured provider.');
            }
        } else {
            console.log('\n❌ Test API call failed!');
            console.log('Error:', result.error || result.message);
        }

    } catch (error) {
        console.error('💥 API Test Error:', error.message);

        // Check if it's a connection error
        if (error.message.includes('ECONNREFUSED')) {
            console.log('\n💡 Make sure the development server is running with: npm run dev');
        }
    }
}

// Add fetch polyfill for Node.js
if (typeof fetch === 'undefined') {
    global.fetch = require('node-fetch');
}

testWhatsAppAPI();
