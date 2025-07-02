#!/usr/bin/env node

// Detailed API diagnostic
async function diagnoseAPI() {
    console.log('🔍 WhatsApp API Diagnostic Tool\n');

    const testPhone = '+251944113998';

    try {
        console.log('1️⃣ Testing WhatsApp Test API...');

        const response = await fetch('http://localhost:3000/api/whatsapp/test', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                phoneNumber: testPhone
            })
        });

        console.log('📡 Response Status:', response.status);
        console.log('📡 Response Headers:', Object.fromEntries(response.headers.entries()));

        const responseText = await response.text();
        console.log('📡 Raw Response:', responseText.substring(0, 500) + (responseText.length > 500 ? '...' : ''));

        // Try to parse as JSON
        try {
            const jsonResult = JSON.parse(responseText);
            console.log('📊 Parsed JSON:', JSON.stringify(jsonResult, null, 2));
        } catch (parseError) {
            console.log('❌ JSON Parse Error:', parseError.message);
            console.log('💡 Response is not valid JSON - likely HTML redirect or error page');
        }

        console.log('\n2️⃣ Testing WhatsApp Status API...');

        const statusResponse = await fetch('http://localhost:3000/api/whatsapp/status', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        console.log('📡 Status Response:', statusResponse.status);
        const statusText = await statusResponse.text();
        console.log('📡 Status Raw:', statusText.substring(0, 200) + '...');

        console.log('\n3️⃣ Testing Configuration...');

        // Test debug endpoint
        const debugResponse = await fetch('http://localhost:3000/api/whatsapp/debug/provider', {
            method: 'GET'
        });

        console.log('📡 Debug Response:', debugResponse.status);
        const debugText = await debugResponse.text();
        console.log('📡 Debug Raw:', debugText.substring(0, 200) + '...');

    } catch (error) {
        console.error('💥 Diagnostic Error:', error.message);

        if (error.message.includes('ECONNREFUSED')) {
            console.log('\n💡 Server not running. Start with: npm run dev');
        }
    }

    console.log('\n🔍 Diagnosis Summary:');
    console.log('- If you see HTML responses: APIs need authentication');
    console.log('- If you see JSON errors: Check server logs');
    console.log('- If connection refused: Start development server');
    console.log('\n💡 Solution: Access the APIs through the authenticated web interface');
    console.log('   Go to: http://localhost:3000 → Login → Settings → WhatsApp');
}

// Polyfill fetch for Node.js
if (typeof fetch === 'undefined') {
    try {
        global.fetch = require('node-fetch');
    } catch (e) {
        console.log('Using built-in fetch');
    }
}

diagnoseAPI();
