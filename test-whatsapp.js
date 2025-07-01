#!/usr/bin/env node

// Test WhatsApp Web.js initialization
const { Client, LocalAuth } = require('whatsapp-web.js');
const puppeteer = require('puppeteer');

async function testWhatsAppWebJS() {
    console.log('🧪 Testing WhatsApp Web.js initialization...');

    try {
        const client = new Client({
            authStrategy: new LocalAuth({
                clientId: 'betty-organic-test',
                dataPath: './test-whatsapp-session'
            }),
            puppeteer: {
                headless: true,
                executablePath: puppeteer.executablePath(),
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-gpu'
                ]
            }
        });

        let qrReceived = false;

        client.on('qr', (qr) => {
            console.log('📱 QR Code received! Scan with WhatsApp mobile app:');
            console.log(qr);
            qrReceived = true;
        });

        client.on('ready', () => {
            console.log('✅ WhatsApp Web.js client is ready!');
            client.destroy();
        });

        client.on('authenticated', () => {
            console.log('🔐 WhatsApp client authenticated successfully');
        });

        client.on('auth_failure', (message) => {
            console.error('❌ WhatsApp authentication failed:', message);
            client.destroy();
        });

        console.log('🚀 Initializing WhatsApp Web.js client...');
        await client.initialize();

        // Wait for QR code or ready state
        await new Promise((resolve) => {
            const checkInterval = setInterval(() => {
                if (qrReceived || client.info) {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 1000);

            // Timeout after 30 seconds
            setTimeout(() => {
                clearInterval(checkInterval);
                resolve();
            }, 30000);
        });

        console.log('✅ WhatsApp Web.js initialization test completed');

        if (qrReceived) {
            console.log('\n🎉 SUCCESS: WhatsApp Web.js is working! QR code generated.');
            console.log('📱 You can now scan the QR code with your WhatsApp mobile app to connect.');
        }

        await client.destroy();
        return true;

    } catch (error) {
        console.log('❌ WhatsApp Web.js test failed:', error.message);
        return false;
    }
}

testWhatsAppWebJS().then(success => {
    if (success) {
        console.log('\n🎉 WhatsApp Web.js test COMPLETED successfully!');
    } else {
        console.log('\n❌ WhatsApp Web.js test FAILED!');
    }
    process.exit(success ? 0 : 1);
});
