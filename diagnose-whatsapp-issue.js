#!/usr/bin/env node

/**
 * WhatsApp Notification Issue Diagnosis
 * 
 * This script helps identify why automatic order notifications aren't working.
 */

console.log('🔍 Diagnosing WhatsApp Notification Issues...\n');

// Check basic configuration
console.log('1️⃣ Configuration Check:');
console.log('   Admin Phone:', '+251944113998');
console.log('   Environment: Development');

// Check if the Baileys session exists
const fs = require('fs');
const path = require('path');

console.log('\n2️⃣ Baileys Session Check:');
const sessionDir = path.resolve('./baileys-session');
const credentialsFile = path.join(sessionDir, 'creds.json');

if (fs.existsSync(sessionDir)) {
    console.log('✅ Session directory exists');
    const files = fs.readdirSync(sessionDir);
    console.log('   Session files:', files.length, 'files found');

    if (fs.existsSync(credentialsFile)) {
        console.log('✅ Credentials file exists');
        try {
            const creds = JSON.parse(fs.readFileSync(credentialsFile, 'utf8'));
            console.log('✅ Credentials loaded successfully');
            console.log('   Has noiseKey:', !!creds.noiseKey);
            console.log('   Has signedIdentityKey:', !!creds.signedIdentityKey);
        } catch (e) {
            console.log('❌ Invalid credentials file:', e.message);
        }
    } else {
        console.log('❌ No credentials file - WhatsApp not connected');
    }
} else {
    console.log('❌ No session directory - WhatsApp never connected');
}

console.log('\n3️⃣ Most Likely Issues:');

// Check if Baileys is connected
if (!fs.existsSync(credentialsFile)) {
    console.log('🔴 MAIN ISSUE: WhatsApp not connected to Baileys');
    console.log('   📝 Solution: Open the admin panel and connect WhatsApp first');
    console.log('   🔗 Go to: /admin/settings/whatsapp');
    console.log('   📱 Scan the QR code with your admin WhatsApp');
} else {
    console.log('🟡 POSSIBLE ISSUE: Baileys connection lost');
    console.log('   📝 Solution: Restart the WhatsApp connection');
    console.log('   🔗 Go to: /admin/settings/whatsapp');
    console.log('   🔄 Click "Reset Connection" and scan QR again');
}

console.log('\n4️⃣ Test Order Creation:');
console.log('   1. Make sure WhatsApp is connected first');
console.log('   2. Create a test order in the app');
console.log('   3. Check if you receive WhatsApp notification');
console.log('   4. Check browser console for any errors');

console.log('\n5️⃣ Expected Flow:');
console.log('   ✅ Customer creates order');
console.log('   ✅ System calls sendOrderNotificationWhatsApp()');
console.log('   ✅ Function sends message via Baileys');
console.log('   ✅ Admin receives WhatsApp notification');

console.log('\n🎯 Action Required:');
console.log('   1. Connect WhatsApp in admin panel first');
console.log('   2. Test order creation');
console.log('   3. Verify notification received');

console.log('\n📱 Admin Phone: +251944113998');
console.log('🔗 Admin Panel: http://localhost:3000/admin/settings/whatsapp');
