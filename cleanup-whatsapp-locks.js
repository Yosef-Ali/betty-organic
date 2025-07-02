#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

async function cleanupWhatsAppLocks() {
    console.log('🧹 Starting WhatsApp session cleanup...');

    const sessionPath = path.resolve('./whatsapp-session');
    const sessionDir = path.join(sessionPath, 'session-betty-organic-app');

    if (!fs.existsSync(sessionDir)) {
        console.log('✅ No session directory found, nothing to clean');
        return;
    }

    // List of lock files to remove
    const lockFiles = [
        'SingletonLock',
        'SingletonCookie',
        'SingletonSocket',
        'DevToolsActivePort',
        'RunningChromeVersion'
    ];

    let cleanedFiles = 0;

    for (const lockFile of lockFiles) {
        const lockPath = path.join(sessionDir, lockFile);

        if (fs.existsSync(lockPath)) {
            try {
                const stats = fs.lstatSync(lockPath);

                if (stats.isSymbolicLink()) {
                    fs.unlinkSync(lockPath);
                    console.log(`🔓 Removed symlink: ${lockFile}`);
                } else {
                    fs.unlinkSync(lockPath);
                    console.log(`🔓 Removed file: ${lockFile}`);
                }
                cleanedFiles++;
            } catch (error) {
                console.warn(`⚠️ Could not remove ${lockFile}:`, error.message);
            }
        }
    }

    // Kill any running Chrome processes related to our session
    try {
        const { execSync } = require('child_process');

        // Find Chrome processes with our session path
        try {
            const processes = execSync(`ps aux | grep "chrome.*betty-organic-app" | grep -v grep`, { encoding: 'utf8' });

            if (processes.trim()) {
                console.log('🔍 Found running Chrome processes:');
                console.log(processes);

                // Extract PIDs and kill them
                const lines = processes.trim().split('\n');
                for (const line of lines) {
                    const pid = line.trim().split(/\s+/)[1];
                    if (pid && /^\d+$/.test(pid)) {
                        try {
                            execSync(`kill -9 ${pid}`);
                            console.log(`🔪 Killed Chrome process: ${pid}`);
                            cleanedFiles++;
                        } catch (killError) {
                            console.warn(`⚠️ Could not kill process ${pid}:`, killError.message);
                        }
                    }
                }
            } else {
                console.log('✅ No running Chrome processes found for our session');
            }
        } catch (psError) {
            // No processes found or ps command failed - this is fine
            console.log('✅ No running Chrome processes found');
        }
    } catch (error) {
        console.warn('⚠️ Error checking for running processes:', error.message);
    }

    if (cleanedFiles > 0) {
        console.log(`✅ Cleanup complete! Removed ${cleanedFiles} lock files/processes`);
        console.log('🔄 WhatsApp Web.js should now be able to start fresh');
    } else {
        console.log('✅ No cleanup needed, session was already clean');
    }
}

cleanupWhatsAppLocks().catch(console.error);
