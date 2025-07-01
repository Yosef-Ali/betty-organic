#!/usr/bin/env node

// Test WhatsApp Web.js browser availability
const puppeteer = require('puppeteer');

async function testBrowser() {
    console.log('🧪 Testing Puppeteer browser availability...');

    try {
        console.log('📍 Puppeteer version:', require('puppeteer/package.json').version);
        console.log('🔍 Browser executable path:', puppeteer.executablePath());

        // Check if executable exists
        const fs = require('fs');
        const executablePath = puppeteer.executablePath();

        if (!fs.existsSync(executablePath)) {
            console.log('❌ Browser executable not found at:', executablePath);
            return false;
        }

        console.log('✅ Browser executable found');

        // Try to launch browser
        console.log('🚀 Attempting to launch browser...');
        const browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu'
            ]
        });

        console.log('✅ Browser launched successfully');

        // Test opening a page
        const page = await browser.newPage();
        await page.goto('https://web.whatsapp.com', { waitUntil: 'networkidle0', timeout: 30000 });

        console.log('✅ WhatsApp Web page loaded successfully');

        await browser.close();
        console.log('✅ Browser closed');

        return true;
    } catch (error) {
        console.log('❌ Browser test failed:', error.message);
        return false;
    }
}

testBrowser().then(success => {
    if (success) {
        console.log('\n🎉 WhatsApp Web.js browser test PASSED! Browser automation is working.');
    } else {
        console.log('\n❌ WhatsApp Web.js browser test FAILED! Browser automation not available.');
    }
    process.exit(success ? 0 : 1);
});
