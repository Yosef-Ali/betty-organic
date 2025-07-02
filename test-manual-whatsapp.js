#!/usr/bin/env node

const path = require('path');
process.chdir('/Users/mekdesyared/betty-organic-app');

// Test the manual WhatsApp functionality
async function testManualMode() {
    console.log('🧪 Testing Manual WhatsApp Mode...\n');

    try {
        // Test basic URL generation first
        console.log('🔧 Testing URL generation...');

        const phone = '+251912345678';
        const message = `🧪 *Test Message - Betty Organic*

This is a test message from your Betty Organic WhatsApp integration.

Provider: Manual Mode
Time: ${new Date().toLocaleString()}

If you can see this message, the WhatsApp integration is working correctly! ✅`;

        // Generate URL manually
        const cleanPhone = phone.replace(/[^\d]/g, '');
        const formattedPhone = cleanPhone.startsWith('251') ? cleanPhone : `251${cleanPhone.substring(1)}`;
        const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;

        console.log('✅ URL Generation Test Result:');
        console.log('   Original Phone:', phone);
        console.log('   Formatted Phone:', formattedPhone);
        console.log('   WhatsApp URL:', whatsappUrl);
        console.log('\n📱 You can click this URL to send the test message!');
        console.log('\n💡 This URL should open WhatsApp and pre-fill the message.');

        // Test if the URL is properly formatted
        try {
            new URL(whatsappUrl);
            console.log('✅ URL is valid and properly formatted');
        } catch (urlError) {
            console.log('❌ URL format error:', urlError.message);
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testManualMode();
