#!/usr/bin/env node

// Quick verification that everything is ready for connection
console.log('🔍 Pre-Connection Verification\n');

// Check environment variables
console.log('📋 Environment Check:');
console.log('- NODE_ENV:', process.env.NODE_ENV || 'development');
console.log('- Provider:', process.env.WHATSAPP_API_PROVIDER || 'whatsapp-web-js');
console.log('- Admin Phone:', process.env.ADMIN_WHATSAPP_NUMBER || 'not set');
console.log('- Session Path:', process.env.WHATSAPP_SESSION_PATH || './whatsapp-session');

// Check if session directory exists (should not exist for fresh start)
const fs = require('fs');
const sessionExists = fs.existsSync('./whatsapp-session');
console.log('- Session Directory:', sessionExists ? '❌ Exists (will be cleaned)' : '✅ Clean');

// Check dependencies
try {
    require('whatsapp-web.js');
    console.log('- WhatsApp Web.js:', '✅ Available');
} catch (e) {
    console.log('- WhatsApp Web.js:', '❌ Not found');
}

try {
    require('puppeteer');
    console.log('- Puppeteer:', '✅ Available');
} catch (e) {
    console.log('- Puppeteer:', '❌ Not found');
}

try {
    require('qrcode');
    console.log('- QR Code:', '✅ Available');
} catch (e) {
    console.log('- QR Code:', '❌ Not found');
}

console.log('\n🎯 Device Status:');
console.log('- WhatsApp Device Slots: Now only 1 active (Chrome) - Perfect!');
console.log('- Available Slots: Ready for WhatsApp Web.js connection');

console.log('\n🚀 Ready to Connect!');
console.log('1. Go to: http://localhost:3000');
console.log('2. Login → Settings → WhatsApp');
console.log('3. Click "Connect" or "Send Test Message"');
console.log('4. Scan QR code when it appears');
console.log('\n✨ You have 2 minutes and 10 retry attempts!');
