#!/usr/bin/env node

// Test WhatsApp Web.js connection with detailed feedback
async function testConnection() {
    console.log('🚀 Testing WhatsApp Web.js Connection...\n');

    try {
        console.log('📋 Step 1: Checking configuration...');

        // Test configuration endpoint
        const configTest = await fetch('http://localhost:3000/api/whatsapp/debug/provider');
        if (configTest.ok) {
            const config = await configTest.json();
            console.log('✅ Configuration:', JSON.stringify(config, null, 2));
        } else {
            console.log('⚠️ Configuration check requires authentication');
        }

        console.log('\n📋 Step 2: Starting WhatsApp initialization...');

        // Test initialization
        const initTest = await fetch('http://localhost:3000/api/whatsapp/status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'initialize' })
        });

        if (initTest.ok) {
            const initResult = await initTest.json();
            console.log('📊 Initialization Result:', JSON.stringify(initResult, null, 2));

            if (initResult.qrCode) {
                console.log('\n📱 QR Code is available!');
                console.log('🔍 QR Code length:', initResult.qrCode.length);
                console.log('💡 Go to your settings page to see the QR code');
            }
        } else {
            console.log('❌ Initialization requires authentication');
        }

        console.log('\n📋 Step 3: Checking status...');

        // Check status
        const statusTest = await fetch('http://localhost:3000/api/whatsapp/status');
        if (statusTest.ok) {
            const status = await statusTest.json();
            console.log('📊 Current Status:', JSON.stringify(status, null, 2));
        } else {
            console.log('⚠️ Status check requires authentication');
        }

        console.log('\n🎯 Next Steps:');
        console.log('1. Open your browser and go to: http://localhost:3000');
        console.log('2. Login to your dashboard');
        console.log('3. Go to Settings → WhatsApp');
        console.log('4. Click "Connect" or "Send Test Message"');
        console.log('5. Scan the QR code that appears with your phone');
        console.log('\n💡 Important Notes:');
        console.log('- Make sure to logout of some existing WhatsApp Web sessions first');
        console.log('- WhatsApp allows only a limited number of linked devices');
        console.log('- The QR code will refresh every 20 seconds if not scanned');

    } catch (error) {
        console.error('💥 Connection Test Error:', error.message);

        if (error.message.includes('ECONNREFUSED')) {
            console.log('\n💡 Make sure the development server is running:');
            console.log('   npm run dev');
        }
    }
}

// Add fetch polyfill for Node.js environments
if (typeof fetch === 'undefined') {
    try {
        global.fetch = require('node-fetch');
    } catch (e) {
        console.log('Note: Using built-in fetch');
    }
}

testConnection();
