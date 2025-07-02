#!/usr/bin/env node

// Test WhatsApp Web.js automatic messaging setup
async function testWebJsSetup() {
    console.log('🧪 Testing WhatsApp Web.js Automatic Setup...\n');

    try {
        // Test the configuration
        console.log('📋 Testing configuration...');

        const testData = {
            phoneNumber: '+251944113998'  // Using the admin number from env
        };

        console.log('🚀 Calling WhatsApp status API...');
        const statusResponse = await fetch('http://localhost:3000/api/whatsapp/status', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('📡 Status Response:', statusResponse.status);

        if (statusResponse.ok) {
            const statusResult = await statusResponse.json();
            console.log('📊 Status Result:', JSON.stringify(statusResult, null, 2));
        } else {
            console.log('❌ Status check failed - likely requires authentication');
        }

        console.log('\n🚀 Calling WhatsApp test API...');
        const testResponse = await fetch('http://localhost:3000/api/whatsapp/test', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testData)
        });

        console.log('📡 Test Response:', testResponse.status);

        if (testResponse.ok) {
            const testResult = await testResponse.json();
            console.log('📊 Test Result:', JSON.stringify(testResult, null, 2));

            if (testResult.success) {
                console.log('\n✅ WhatsApp Web.js setup is working!');

                if (testResult.qrCode) {
                    console.log('📱 QR Code available - scan with your WhatsApp mobile app');
                } else if (testResult.messageId) {
                    console.log('📨 Message sent automatically!');
                } else if (testResult.whatsappUrl) {
                    console.log('🔗 Manual URL generated (fallback mode)');
                }
            }
        } else {
            console.log('❌ Test call failed - likely requires authentication');
            console.log('💡 Try accessing the settings page in your browser first');
        }

    } catch (error) {
        console.error('💥 Setup Test Error:', error.message);

        if (error.message.includes('ECONNREFUSED')) {
            console.log('\n💡 Make sure the development server is running');
        }
    }
}

// Add fetch polyfill for Node.js environments
if (typeof fetch === 'undefined') {
    try {
        global.fetch = require('node-fetch');
    } catch (e) {
        console.log('Note: node-fetch not available, using built-in fetch');
    }
}

testWebJsSetup();
