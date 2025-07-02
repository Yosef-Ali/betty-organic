#!/usr/bin/env node

// Test the current WhatsApp client status
async function checkStatus() {
    console.log('🔍 Checking WhatsApp Client Status...\n');

    try {
        // First, let's simulate what happens in the browser
        console.log('1️⃣ Simulating browser test call...');

        const testResponse = await fetch('http://localhost:3000/api/whatsapp/test', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'WhatsApp-Status-Checker'
            },
            body: JSON.stringify({
                phoneNumber: '+251944113998'
            })
        });

        console.log('📡 Test Response Status:', testResponse.status);

        if (testResponse.status === 200) {
            try {
                const testResult = await testResponse.json();
                console.log('📊 Test Result:', JSON.stringify(testResult, null, 2));

                if (testResult.success) {
                    console.log('✅ Test passed! Message should have been sent.');
                } else {
                    console.log('❌ Test failed:', testResult.message || testResult.error);

                    if (testResult.error && testResult.error.includes('not ready')) {
                        console.log('\n💡 Solution: The WhatsApp client needs more time to be ready.');
                        console.log('   Wait a few more seconds and try again.');
                    }
                }
            } catch (parseError) {
                console.log('❌ Could not parse test response as JSON');
                const text = await testResponse.text();
                console.log('Raw response:', text.substring(0, 200) + '...');
            }
        } else {
            console.log('❌ Test API call failed with status:', testResponse.status);
        }

        console.log('\n2️⃣ Checking client status directly...');

        const statusResponse = await fetch('http://localhost:3000/api/whatsapp/debug/status');
        console.log('📡 Status Response:', statusResponse.status);

        if (statusResponse.status === 200) {
            try {
                const statusResult = await statusResponse.json();
                console.log('📊 Client Status:', JSON.stringify(statusResult, null, 2));
            } catch (parseError) {
                console.log('❌ Could not parse status response');
            }
        }

    } catch (error) {
        console.error('💥 Status Check Error:', error.message);

        if (error.message.includes('ECONNREFUSED')) {
            console.log('\n💡 Server not running. Start with: npm run dev');
        }
    }

    console.log('\n🎯 Summary:');
    console.log('- If test shows "not ready": Wait 30-60 seconds and try again');
    console.log('- If test shows "authentication": QR code needs to be scanned again');
    console.log('- If test succeeds: WhatsApp automatic messaging is working!');
}

// Polyfill fetch for Node.js
if (typeof fetch === 'undefined') {
    try {
        global.fetch = require('node-fetch');
    } catch (e) {
        console.log('Using built-in fetch');
    }
}

checkStatus();
