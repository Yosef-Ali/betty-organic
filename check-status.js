#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function checkWhatsAppStatus() {
    console.log('🔍 Checking WhatsApp Web.js session status...\n');

    const sessionPath = path.resolve('./whatsapp-session');
    const sessionDir = path.join(sessionPath, 'session-betty-organic-app');

    if (!fs.existsSync(sessionDir)) {
        console.log('✅ No session directory - ready for fresh start');
        return;
    }

    console.log('📁 Session directory exists');

    // Check for lock files
    const lockFiles = [
        'SingletonLock',
        'SingletonCookie',
        'SingletonSocket',
        'DevToolsActivePort',
        'RunningChromeVersion'
    ];

    let locksFound = 0;

    for (const lockFile of lockFiles) {
        const lockPath = path.join(sessionDir, lockFile);
        if (fs.existsSync(lockPath)) {
            console.log(`⚠️ Found lock file: ${lockFile}`);
            locksFound++;
        }
    }

    if (locksFound === 0) {
        console.log('✅ No lock files found - session is clean');
    } else {
        console.log(`❌ Found ${locksFound} lock files - may need cleanup`);
    }

    // Check for running Chrome processes
    try {
        const { execSync } = require('child_process');
        const processes = execSync(`ps aux | grep "chrome.*betty-organic-app" | grep -v grep`, { encoding: 'utf8' });

        if (processes.trim()) {
            console.log('⚠️ Found running Chrome processes:');
            const lines = processes.trim().split('\n');
            console.log(`   ${lines.length} process(es) running`);
        } else {
            console.log('✅ No Chrome processes running for this session');
        }
    } catch (error) {
        console.log('✅ No Chrome processes running for this session');
    }

    console.log('\n🎯 Summary:');
    if (locksFound === 0) {
        console.log('✅ WhatsApp Web.js should be able to start cleanly');
        console.log('💡 You can now test the WhatsApp connection through your app');
    } else {
        console.log('⚠️ Some cleanup may be needed');
        console.log('💡 Run: node cleanup-whatsapp-locks.js');
    }
}

checkWhatsAppStatus();
