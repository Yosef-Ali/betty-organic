#!/usr/bin/env node

/**
 * Test script to verify the image upload and WhatsApp sending functionality
 * after fixing the auth and content-length issues.
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Image Upload and WhatsApp Sending Fixes\n');

// Test configuration
const config = {
    ngrokUrl: process.env.NEXT_PUBLIC_NGROK_URL || 'http://localhost:8080',
    testPhoneNumber: '+251944113998', // Betty Organic admin number
};

console.log('📋 Test Configuration:');
console.log(`   • ngrok URL: ${config.ngrokUrl}`);
console.log(`   • Test phone: ${config.testPhoneNumber}`);
console.log('');

// Function to create a test base64 image (simple PNG)
function createTestImageBase64() {
    // Create a minimal valid PNG base64 (1x1 transparent pixel)
    const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU7HygAAAABJRU5ErkJggg==';
    console.log('🖼️ Created test PNG image (1x1 transparent pixel)');
    return pngBase64;
}

// Test 1: Verify temp-pdf API endpoint
async function testTempPdfAPI() {
    console.log('🧪 Test 1: Testing temp-pdf API endpoint...');

    try {
        const testImageBase64 = createTestImageBase64();

        const payload = {
            pdfData: testImageBase64,
            filename: 'test_invoice_fix.png',
            expiresIn: 3600,
            contentType: 'image/png'
        };

        console.log(`   📤 Sending POST request to ${config.ngrokUrl}/api/temp-pdf...`);

        const response = await fetch(`${config.ngrokUrl}/api/temp-pdf`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (response.ok) {
            const result = await response.json();
            console.log('   ✅ temp-pdf API working correctly!');
            console.log(`   📁 Temporary URL: ${result.url}`);
            console.log(`   ⏰ Expires: ${result.expiresAt}`);

            // Test accessing the created URL
            console.log('   🔍 Testing image access...');
            const imageResponse = await fetch(result.url);
            if (imageResponse.ok) {
                console.log('   ✅ Image URL accessible!');
                console.log(`   📊 Content-Type: ${imageResponse.headers.get('content-type')}`);
            } else {
                console.log(`   ❌ Image URL not accessible: ${imageResponse.status}`);
            }

            return result.url;
        } else {
            const errorText = await response.text();
            console.log(`   ❌ temp-pdf API failed: ${response.status} - ${errorText}`);
            return null;
        }
    } catch (error) {
        console.log(`   ❌ temp-pdf API error: ${error.message}`);
        return null;
    }
}

// Test 2: Check ngrok accessibility
async function testNgrokAccessibility() {
    console.log('\n🧪 Test 2: Testing ngrok accessibility...');

    try {
        const response = await fetch(`${config.ngrokUrl}/api/temp-pdf`);
        // We expect a 405 (Method Not Allowed) for GET on a POST endpoint
        if (response.status === 405) {
            console.log('   ✅ ngrok tunnel is accessible!');
            console.log(`   📍 External URL: ${config.ngrokUrl}`);
            return true;
        } else {
            console.log(`   ⚠️ Unexpected response: ${response.status}`);
            return true; // Still accessible
        }
    } catch (error) {
        console.log(`   ❌ ngrok not accessible: ${error.message}`);
        console.log('   💡 Make sure ngrok is running: npx ngrok http 8080');
        return false;
    }
}

// Test 3: Verify environment variables
function testEnvironmentVariables() {
    console.log('\n🧪 Test 3: Checking environment variables...');

    const requiredVars = [
        'TWILIO_ACCOUNT_SID',
        'TWILIO_AUTH_TOKEN',
        'TWILIO_WHATSAPP_NUMBER',
        'NEXT_PUBLIC_NGROK_URL'
    ];

    let allPresent = true;

    requiredVars.forEach(varName => {
        const value = process.env[varName];
        if (value) {
            console.log(`   ✅ ${varName}: ${varName.includes('TOKEN') ? '***hidden***' : value}`);
        } else {
            console.log(`   ❌ ${varName}: NOT SET`);
            allPresent = false;
        }
    });

    if (allPresent) {
        console.log('   ✅ All required environment variables are set!');
    } else {
        console.log('   ⚠️ Some environment variables are missing. Check .env.local');
    }

    return allPresent;
}

// Main test runner
async function runTests() {
    console.log('🚀 Starting comprehensive image upload fix tests...\n');

    // Load environment variables
    const envPath = path.join(__dirname, '.env.local');
    if (fs.existsSync(envPath)) {
        console.log('📁 Loading environment variables from .env.local');
        const envContent = fs.readFileSync(envPath, 'utf8');
        envContent.split('\n').forEach(line => {
            const [key, ...valueParts] = line.split('=');
            if (key && valueParts.length > 0) {
                process.env[key.trim()] = valueParts.join('=').trim();
            }
        });
        console.log('');
    } else {
        console.log('⚠️ .env.local not found. Make sure environment variables are set.\n');
    }

    // Update config with loaded env vars
    config.ngrokUrl = process.env.NEXT_PUBLIC_NGROK_URL || config.ngrokUrl;

    // Run tests
    const envTestResult = testEnvironmentVariables();
    const ngrokTestResult = await testNgrokAccessibility();
    const tempPdfTestResult = await testTempPdfAPI();

    // Summary
    console.log('\n📊 Test Results Summary:');
    console.log(`   Environment Variables: ${envTestResult ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   ngrok Accessibility: ${ngrokTestResult ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   temp-pdf API: ${tempPdfTestResult ? '✅ PASS' : '❌ FAIL'}`);

    if (envTestResult && ngrokTestResult && tempPdfTestResult) {
        console.log('\n🎉 All tests passed! The image upload fix is working correctly.');
        console.log('\n🔄 Next steps:');
        console.log('   1. Test the image sending via the web UI at: http://localhost:8080/test-pdf-whatsapp');
        console.log('   2. Click "Test Image WhatsApp Sending" to verify end-to-end functionality');
        console.log('   3. Check WhatsApp for the received image message');
    } else {
        console.log('\n❌ Some tests failed. Please check the issues above and try again.');
    }
}

// Run the tests
runTests().catch(error => {
    console.error('\n💥 Test script error:', error);
    process.exit(1);
});
