#!/usr/bin/env node

// Clean WhatsApp Web.js session and restart
const fs = require('fs');
const path = require('path');

async function cleanupWhatsAppSession() {
    console.log('🧹 Cleaning up WhatsApp Web.js session...\n');

    const sessionPath = path.join(process.cwd(), 'whatsapp-session');

    try {
        // Check if session directory exists
        if (fs.existsSync(sessionPath)) {
            console.log('📁 Found existing session directory:', sessionPath);

            // Remove the entire session directory
            console.log('🗑️ Removing session directory...');
            fs.rmSync(sessionPath, { recursive: true, force: true });
            console.log('✅ Session directory removed successfully');
        } else {
            console.log('ℹ️ No existing session directory found');
        }

        // Kill any existing Chrome processes that might be hanging
        console.log('\n🔄 Killing any hanging Chrome processes...');
        const { exec } = require('child_process');

        // Kill Chrome processes related to WhatsApp Web.js
        exec('pkill -f "chrome.*whatsapp" || true', (error, stdout, stderr) => {
            if (error && !error.message.includes('No matching processes')) {
                console.log('⚠️ Error killing Chrome processes:', error.message);
            } else {
                console.log('✅ Chrome cleanup completed');
            }
        });

        // Also kill any node processes that might be stuck
        exec('pkill -f "whatsapp-web.js" || true', (error, stdout, stderr) => {
            if (error && !error.message.includes('No matching processes')) {
                console.log('⚠️ Error killing WhatsApp processes:', error.message);
            } else {
                console.log('✅ WhatsApp process cleanup completed');
            }
        });

        console.log('\n🎉 Cleanup completed successfully!');
        console.log('\n📋 Next steps:');
        console.log('1. Go to your WhatsApp settings page');
        console.log('2. Click "Connect" or "Send Test Message"');
        console.log('3. Wait for the QR code to appear');
        console.log('4. Scan the QR code with your phone');
        console.log('\n💡 Tip: If you have existing WhatsApp Web sessions open in your browser,');
        console.log('   consider logging out of some of them to free up device slots.');

    } catch (error) {
        console.error('❌ Cleanup failed:', error.message);
    }
}

cleanupWhatsAppSession();
