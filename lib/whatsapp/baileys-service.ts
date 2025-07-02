import * as baileys from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import fs from 'fs';
import path from 'path';
const qrcode = require('qrcode-terminal');

const { makeWASocket, useMultiFileAuthState, DisconnectReason } = baileys;

// Access the same global image storage used by temp-image API
declare global {
    var imageStorage: Map<string, {
        data: string;
        filename: string;
        expiresAt: number
    }> | undefined;
}

const getImageStorage = () => {
    if (!globalThis.imageStorage) {
        globalThis.imageStorage = new Map();
    }
    return globalThis.imageStorage;
};

// Helper function to extract image ID from temp-image URL
function extractImageIdFromUrl(url: string): string | null {
    try {
        // Handle both path formats: /api/temp-image/[id] and /api/temp-image/[id]/route
        const match = url.match(/\/api\/temp-image\/([^\/\?\&]+)/);
        const imageId = match ? match[1] : null;
        
        console.log('🔍 Extracting image ID from URL:', {
            url: url,
            match: match?.[0],
            imageId: imageId
        });
        
        return imageId;
    } catch (error) {
        console.error('❌ Error extracting image ID from URL:', error);
        return null;
    }
}

// Helper function to get image data directly from storage
function getImageDataFromStorage(imageId: string): Buffer | null {
    try {
        const imageStorage = getImageStorage();
        const imageInfo = imageStorage.get(imageId);

        if (!imageInfo) {
            console.log('❌ Image not found in storage:', imageId);
            return null;
        }

        // Check if expired
        if (Date.now() > imageInfo.expiresAt) {
            console.log('⏰ Image expired in storage:', imageId);
            imageStorage.delete(imageId);
            return null;
        }

        console.log('✅ Retrieved image from storage:', {
            imageId,
            filename: imageInfo.filename,
            dataSize: imageInfo.data.length,
            expiresAt: new Date(imageInfo.expiresAt).toISOString(),
            timeUntilExpiry: Math.round((imageInfo.expiresAt - Date.now()) / 1000) + 's'
        });

        return Buffer.from(imageInfo.data, 'base64');
    } catch (error) {
        console.error('❌ Error accessing image storage:', error);
        return null;
    }
}

interface BaileysConfig {
    sessionPath: string;
    phoneNumber: string;
}

interface WhatsAppMessage {
    to: string;
    message?: string;
    mediaPath?: string;
    mediaUrl?: string;
}

// Global variables - these will persist in the Node.js process
let sock: any = null;
let isConnected = false;
let isConnecting = false;
let reconnectAttempts = 0;
let currentQrCode: string | null = null;
const MAX_RECONNECT_ATTEMPTS = 3;
const QR_TIMEOUT = 30000; // 30 seconds - shorter timeout for better UX
let qrTimeout: NodeJS.Timeout | null = null;

// Declare global to ensure singleton across hot reloads
declare global {
    var __whatsapp_sock: any;
    var __whatsapp_connected: boolean;
    var __whatsapp_connecting: boolean;
    var __whatsapp_attempts: number;
    var __whatsapp_qr: string | null;
}

// Initialize from global if available (survives hot reloads)
if (global.__whatsapp_sock !== undefined) {
    sock = global.__whatsapp_sock;
    isConnected = global.__whatsapp_connected || false;
    isConnecting = global.__whatsapp_connecting || false;
    reconnectAttempts = global.__whatsapp_attempts || 0;
    currentQrCode = global.__whatsapp_qr || null;
    console.log('🔄 Restored WhatsApp state from global:', { isConnected, isConnecting, hasClient: !!sock });
}

// Helper to sync state to global (survives hot reloads)
function syncToGlobal() {
    global.__whatsapp_sock = sock;
    global.__whatsapp_connected = isConnected;
    global.__whatsapp_connecting = isConnecting;
    global.__whatsapp_attempts = reconnectAttempts;
    global.__whatsapp_qr = currentQrCode;
}

// Helper function to check if socket is actually ready
function isSocketReady(): boolean {
    if (!sock) return false;

    try {
        // Check if the socket is open and authenticated
        // In Baileys, we need to check if user exists and socket is not closed
        return sock.user && sock.authState?.creds && sock.ws?.readyState === 1;
    } catch (error) {
        console.log('⚠️ Error checking socket state:', error);
        return false;
    }
}

// Helper to save connection state to file
function saveConnectionState() {
    try {
        syncToGlobal(); // Also sync to global
        const stateFile = path.resolve('./baileys-session/connection-state.json');
        const state = {
            isConnected,
            isConnecting,
            reconnectAttempts,
            hasClient: !!sock,
            timestamp: Date.now()
        };
        
        try {
            fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));
            console.log('💾 Connection state saved to file');
        } catch (fsError) {
            console.log('⚠️ Cannot save to file (serverless env), using memory only:', fsError);
        }
    } catch (error) {
        console.log('⚠️ Error saving connection state:', error);
    }
}

// Helper to clear stuck connection state
function clearStuckState() {
    try {
        const stateFile = path.resolve('./baileys-session/connection-state.json');
        if (fs.existsSync(stateFile)) {
            const state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
            // If state shows connecting for more than 2 minutes, clear it
            if (state.isConnecting && Date.now() - state.timestamp > 120000) {
                console.log('🧹 Clearing stuck connecting state');
                try {
                    fs.unlinkSync(stateFile);
                } catch (fsError) {
                    console.log('⚠️ Cannot delete state file (serverless env):', fsError);
                }
                isConnected = false;
                isConnecting = false;
                reconnectAttempts = 0;
                return true;
            }
        }
    } catch (error) {
        console.log('⚠️ Error clearing stuck state (likely serverless env):', error);
    }
    return false;
}

// Helper to load connection state from file
function loadConnectionState() {
    try {
        // First check for stuck states
        if (clearStuckState()) {
            return false;
        }

        const stateFile = path.resolve('./baileys-session/connection-state.json');
        try {
            if (fs.existsSync(stateFile)) {
                const state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
                // Only load if state is recent (within 5 minutes)
                if (Date.now() - state.timestamp < 300000) {
                    isConnected = state.isConnected;
                    isConnecting = state.isConnecting;
                    reconnectAttempts = state.reconnectAttempts;
                    console.log('📂 Connection state loaded:', state);
                    return true;
                } else {
                    console.log('⏰ Connection state is too old, ignoring');
                }
            }
        } catch (fsError) {
            console.log('⚠️ Cannot access state file (serverless env), using global state only');
        }
    } catch (error) {
        console.log('⚠️ Error loading connection state:', error);
    }
    return false;
}

export async function initializeBaileys(config: BaileysConfig) {
    // Load persisted connection state
    loadConnectionState();

    // Prevent multiple simultaneous connection attempts
    if (isConnecting) {
        console.log('⏳ Baileys connection already in progress...');
        return { success: true, status: 'connecting' };
    }

    // If already connected, do not reconnect
    if (isConnected) {
        console.log('✅ Baileys already connected');
        return { success: true, status: 'connected' };
    }

    // If too many failed attempts, require manual reset
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        console.log(`❌ Max reconnection attempts (${MAX_RECONNECT_ATTEMPTS}) reached. Stopping.`);
        return { success: false, status: 'max_attempts_reached', error: 'Too many failed attempts. Please reset WhatsApp connection from the settings panel.' };
    }

    try {
        // Only create a new socket if one does not exist
        if (sock) {
            if (isConnected) {
                return { success: true, status: 'connected' };
            }
            if (isConnecting) {
                return { success: true, status: 'connecting' };
            }
            // If sock exists but not connected, allow re-init
            try {
                sock.end(undefined);
            } catch (e) {
                console.log('⚠️ Error closing stale socket:', e);
            }
            sock = null;
        }

        isConnecting = true;
        reconnectAttempts++;
        console.log(`🚀 Initializing Baileys WhatsApp connection... (Attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);

        // Ensure session directory exists (with serverless compatibility)
        const sessionDir = path.resolve(config.sessionPath);
        try {
            if (!fs.existsSync(sessionDir)) {
                fs.mkdirSync(sessionDir, { recursive: true });
                console.log('✅ Created session directory:', sessionDir);
            }
        } catch (error) {
            console.warn('⚠️ Cannot create session directory in serverless environment:', error);
            console.log('🔄 Using in-memory session storage for serverless deployment');
            // In serverless environments, we'll need to use in-memory storage
            // This means the session won't persist between function invocations
        }

        // Multi-file auth state (compatible with serverless)
        let state, saveCreds;
        try {
            const authResult = await useMultiFileAuthState(sessionDir);
            state = authResult.state;
            saveCreds = authResult.saveCreds;
            console.log('✅ Auth state initialized successfully');
        } catch (authError) {
            console.warn('⚠️ Failed to initialize file-based auth state:', authError);
            console.log('🔄 Falling back to default Baileys behavior for serverless');
            // In serverless, we'll rely on Baileys' default behavior
            // This will create a new session each time (requires QR scan each time)
            const { useMultiFileAuthState } = baileys;
            try {
                // Try to create a temporary in-memory auth state
                const tempDir = '/tmp/baileys-session';
                const authResult = await useMultiFileAuthState(tempDir);
                state = authResult.state;
                saveCreds = authResult.saveCreds;
                console.log('✅ Using temporary auth state');
            } catch (tempError) {
                console.error('❌ All auth state methods failed:', tempError);
                throw new Error('Cannot initialize authentication state in serverless environment');
            }
        }

        // Create WhatsApp socket
        sock = makeWASocket({
            auth: state,
            browser: ['Betty Organic', 'Chrome', '1.0.0'],
            connectTimeoutMs: 60000,
            defaultQueryTimeoutMs: 0,
            keepAliveIntervalMs: 10000,
            emitOwnEvents: true,
            fireInitQueries: true,
            generateHighQualityLinkPreview: true,
            syncFullHistory: false,
            markOnlineOnConnect: true,
        });

        // Handle connection updates
        sock.ev.on('connection.update', (update: any) => {
            const { connection, lastDisconnect, qr } = update;
            console.log(`🔄 Connection update: connection=${connection}, qr=${!!qr}, lastDisconnect=${lastDisconnect?.error?.message}`);

            if (qr) {
                // User-friendly QR code logging
                console.log('==============================');
                console.log('📱 WhatsApp QR Code generated!');
                console.log('Scan this QR code in your WhatsApp app:');
                qrcode.generate(qr, { small: true });
                console.log('==============================');
                currentQrCode = qr;

                // Set timeout for QR code
                if (qrTimeout) clearTimeout(qrTimeout);
                qrTimeout = setTimeout(() => {
                    console.log('⏰ QR Code expired after 30 seconds. Generating fresh QR...');
                    currentQrCode = null;
                    if (sock) {
                        try {
                            sock.end(undefined);
                        } catch (e) {
                            console.log('⚠️ Error closing socket on QR timeout:', e);
                        }
                    }
                    isConnecting = false;
                    saveConnectionState();

                    // Auto-generate new QR code after a brief pause
                    setTimeout(() => {
                        console.log('🔄 Auto-generating new QR code...');
                        initializeBaileys({ sessionPath: './baileys-session', phoneNumber: '' });
                    }, 2000);
                }, QR_TIMEOUT);
            }

            if (connection === 'close') {
                if (qrTimeout) {
                    clearTimeout(qrTimeout);
                    qrTimeout = null;
                }
                const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
                const errorMessage = lastDisconnect?.error?.message;

                // Handle stream errors and timeout scenarios more gracefully
                const isStreamError = errorMessage?.includes('Stream Errored') || statusCode === 515;
                const isQRTimeout = statusCode === 408 || errorMessage?.includes('QR');
                const isLoggedOut = statusCode === DisconnectReason.loggedOut;

                const shouldReconnect = !isLoggedOut &&
                    !isQRTimeout &&
                    reconnectAttempts < MAX_RECONNECT_ATTEMPTS;

                console.log(`❌ Baileys connection closed. Status: ${statusCode}, Error: ${errorMessage}`);
                console.log(`🔍 Error analysis - isStreamError: ${isStreamError}, isQRTimeout: ${isQRTimeout}, isLoggedOut: ${isLoggedOut}`);
                console.log(`🔄 Should reconnect: ${shouldReconnect} (attempts: ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);

                isConnected = false;
                isConnecting = false;
                currentQrCode = null;
                syncToGlobal();
                saveConnectionState();

                if (shouldReconnect) {
                    console.log('⏳ Waiting 3 seconds before reconnecting...');
                    setTimeout(() => initializeBaileys(config), 3000);
                } else {
                    console.log('🛑 Stopping reconnection attempts. Please reset WhatsApp connection from the settings panel if needed.');
                    reconnectAttempts = 0;
                    saveConnectionState();
                }
            } else if (connection === 'open') {
                console.log('✅ WhatsApp connected! Ready to send and receive messages.');
                isConnected = true;
                isConnecting = false;
                currentQrCode = null;
                reconnectAttempts = 0;
                if (qrTimeout) {
                    clearTimeout(qrTimeout);
                    qrTimeout = null;
                }
                syncToGlobal();
                saveConnectionState();
            } else if (connection === 'connecting') {
                console.log('🔄 WhatsApp is connecting...');
                isConnecting = true;
                isConnected = false;
                syncToGlobal();
                saveConnectionState();
            }
        });

        // Save credentials when updated
        sock.ev.on('creds.update', saveCreds);

        return { success: true, status: 'connecting' };
    } catch (error) {
        console.error('❌ Failed to initialize Baileys:', error);
        isConnecting = false;
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}

export async function sendBaileysMessage({ to, message, mediaPath, mediaUrl }: WhatsAppMessage) {
    try {
        // Load current connection state
        loadConnectionState();

        // If state shows connected but sock is null, try to reinitialize
        if (isConnected && !sock) {
            console.log('🔄 State shows connected but socket is null, reinitializing...');
            const reinitResult = await initializeBaileys({ sessionPath: './baileys-session', phoneNumber: '' });
            if (!reinitResult.success) {
                throw new Error('Failed to reinitialize connection');
            }
            // Wait a moment for connection to establish
            await new Promise(resolve => setTimeout(resolve, 3000));
        }

        const socketReady = isSocketReady();
        console.log(`🔍 sendBaileysMessage called - sock: ${!!sock}, isConnected: ${isConnected}, isConnecting: ${isConnecting}, socketReady: ${socketReady}`);

        if (!sock || (!isConnected && !socketReady)) {
            console.log(`❌ Connection check failed - sock: ${!!sock}, isConnected: ${isConnected}, socketReady: ${socketReady}`);
            throw new Error('Baileys not connected. Please scan QR code and connect WhatsApp first.');
        }

        // Update connection state if socket is ready but flag isn't set
        if (socketReady && !isConnected) {
            console.log('🔄 Socket is ready but isConnected flag was false, updating...');
            isConnected = true;
            saveConnectionState();
        }

        // Format phone number for WhatsApp
        const formattedNumber = to.replace(/\D/g, '');
        const jid = `${formattedNumber}@s.whatsapp.net`;

        console.log(`📱 Sending Baileys message to: ${jid}`);

        // Send media if provided
        if (mediaUrl || mediaPath) {
            console.log('📎 Sending media message via Baileys');
            console.log('📊 Media details:', {
                hasMediaUrl: !!mediaUrl,
                hasMediaPath: !!mediaPath,
                mediaUrl: mediaUrl,
                mediaPath: mediaPath
            });

            let mediaBuffer: Buffer;

            // Determine if mediaPath is actually a URL
            const isMediaPathUrl = mediaPath && (mediaPath.startsWith('http://') || mediaPath.startsWith('https://'));

            if (mediaUrl || isMediaPathUrl) {
                const urlToUse = mediaUrl || mediaPath;
                
                if (!urlToUse) {
                    throw new Error('No valid URL provided for media download');
                }
                
                console.log(`🌐 Processing media URL: ${urlToUse}`);

                // Try to get image directly from storage if it's a temp-image URL
                if (urlToUse && urlToUse.includes('/api/temp-image/')) {
                    const imageId = extractImageIdFromUrl(urlToUse);
                    if (imageId) {
                        console.log('🔍 Attempting direct storage access for image ID:', imageId);
                        console.log('⏰ Current time:', new Date().toISOString());
                        const storageBuffer = getImageDataFromStorage(imageId);
                        if (storageBuffer) {
                            mediaBuffer = storageBuffer;
                            console.log(`✅ Retrieved media from storage: ${mediaBuffer.length} bytes`);
                        } else {
                            console.log('⚠️ Storage access failed, falling back to URL fetch...');
                            // Fall back to URL fetch with better error handling
                            try {
                                const response = await fetch(urlToUse);
                                if (!response.ok) {
                                    console.error(`❌ URL fetch failed: ${response.status} ${response.statusText}`);
                                    console.error(`❌ Failed URL: ${urlToUse}`);
                                    throw new Error(`Failed to download media: ${response.statusText}`);
                                }
                                mediaBuffer = Buffer.from(await response.arrayBuffer());
                                console.log(`✅ Downloaded media buffer: ${mediaBuffer.length} bytes`);
                            } catch (fetchError) {
                                console.error('❌ Media download failed:', fetchError);
                                console.error('❌ URL that failed:', urlToUse);
                                throw new Error(`Failed to download media: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`);
                            }
                        }
                    } else {
                        console.log('⚠️ Could not extract image ID from URL, using fetch...');
                        try {
                            const response = await fetch(urlToUse);
                            if (!response.ok) {
                                console.error(`❌ URL fetch failed: ${response.status} ${response.statusText}`);
                                console.error(`❌ Failed URL: ${urlToUse}`);
                                throw new Error(`Failed to download media: ${response.statusText}`);
                            }
                            mediaBuffer = Buffer.from(await response.arrayBuffer());
                            console.log(`✅ Downloaded media buffer: ${mediaBuffer.length} bytes`);
                        } catch (fetchError) {
                            console.error('❌ Media download failed:', fetchError);
                            console.error('❌ URL that failed:', urlToUse);
                            throw new Error(`Failed to download media: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`);
                        }
                    }
                } else {
                    // Regular URL fetch for non-temp-image URLs
                    console.log(`🌐 Downloading media from URL: ${urlToUse}`);
                    try {
                        const response = await fetch(urlToUse);
                        if (!response.ok) {
                            console.error(`❌ URL fetch failed: ${response.status} ${response.statusText}`);
                            console.error(`❌ Failed URL: ${urlToUse}`);
                            throw new Error(`Failed to download media: ${response.statusText}`);
                        }
                        mediaBuffer = Buffer.from(await response.arrayBuffer());
                        console.log(`✅ Downloaded media buffer: ${mediaBuffer.length} bytes`);
                    } catch (fetchError) {
                        console.error('❌ Media download failed:', fetchError);
                        console.error('❌ URL that failed:', urlToUse);
                        throw new Error(`Failed to download media: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`);
                    }
                }
            } else if (mediaPath) {
                console.log(`📁 Reading media from local path: ${mediaPath}`);
                mediaBuffer = fs.readFileSync(mediaPath);
                console.log(`✅ Read local media file: ${mediaBuffer.length} bytes`);
            } else {
                throw new Error('No media source provided');
            }

            // Send image message
            const result = await sock.sendMessage(jid, {
                image: mediaBuffer,
                caption: message || ''
            });

            console.log('✅ Baileys media message sent successfully:', result?.key?.id);
            return { success: true, messageId: result?.key?.id };
        }

        // Send text message
        if (message) {
            console.log('💬 Sending text message via Baileys');
            const result = await sock.sendMessage(jid, { text: message });

            console.log('✅ Baileys text message sent successfully:', result?.key?.id);
            return { success: true, messageId: result?.key?.id };
        }

        throw new Error('No message content provided');

    } catch (error) {
        console.error('❌ Failed to send Baileys message:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

export function getBaileysStatus() {
    // Load current state first
    loadConnectionState();

    // If state shows connected but socket is null, correct the state
    if (isConnected && !sock) {
        console.log('⚠️ State inconsistency detected: isConnected=true but sock=null, correcting...');
        isConnected = false;
        isConnecting = false;
        saveConnectionState();
    }

    console.log(`🔍 getBaileysStatus called - isConnected: ${isConnected}, isConnecting: ${isConnecting}, hasClient: ${!!sock}`);
    return {
        isConnected,
        isConnecting,
        hasClient: !!sock,
        attempts: reconnectAttempts,
        maxAttempts: MAX_RECONNECT_ATTEMPTS,
        canRetry: reconnectAttempts < MAX_RECONNECT_ATTEMPTS,
        qrCode: currentQrCode
    };
}

export async function resetBaileysConnection() {
    console.log('🔄 Resetting Baileys connection...');

    // Clear timeouts
    if (qrTimeout) {
        clearTimeout(qrTimeout);
        qrTimeout = null;
    }

    // Clear QR code
    currentQrCode = null;

    // Close existing connection
    if (sock) {
        try {
            sock.end(undefined);
        } catch (error) {
            console.log('⚠️ Error closing socket:', error);
        }
    }

    // Reset state
    sock = null;
    isConnected = false;
    isConnecting = false;
    reconnectAttempts = 0;

    // Also clear session files for a truly fresh start
    try {
        // Try to clear both possible session directories
        const sessionDirs = ['./baileys-session', '/tmp/baileys-session'];
        for (const sessionDir of sessionDirs) {
            const resolvedDir = path.resolve(sessionDir);
            try {
                if (fs.existsSync(resolvedDir)) {
                    fs.rmSync(resolvedDir, { recursive: true, force: true });
                    console.log(`🗑️ Session files deleted: ${resolvedDir}`);
                }
            } catch (dirError) {
                console.log(`⚠️ Cannot delete session dir ${resolvedDir} (likely serverless):`, dirError);
            }
        }
    } catch (e) {
        console.log('⚠️ Error deleting session files:', e);
    }

    console.log('✅ Baileys connection reset complete');
    return { success: true, message: 'Connection reset successfully' };
}

export async function testBaileysConnection(phoneNumber: string) {
    try {
        const status = getBaileysStatus();
        console.log('🔍 Testing Baileys connection:', status);

        if (!status.isConnected) {
            return {
                success: false,
                message: 'Baileys not connected. Please scan QR code first.',
                status
            };
        }

        // Send test message
        const result = await sendBaileysMessage({
            to: phoneNumber,
            message: '🧪 Test message from Betty Organic - Baileys WhatsApp integration is working!'
        });

        return {
            success: result.success,
            message: result.success
                ? 'Test message sent successfully via Baileys!'
                : `Failed to send test message: ${result.error}`,
            messageId: result.messageId,
            status
        };
    } catch (error) {
        console.error('❌ Baileys test failed:', error);
        return {
            success: false,
            message: `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            status: getBaileysStatus()
        };
    }
}
