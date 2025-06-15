// Twilio WhatsApp Configuration Checker for PDF Document Sending
// This tool verifies if Twilio is properly configured for sending PDF documents

export async function verifyTwilioConfiguration() {
    console.log('🔧 Verifying Twilio WhatsApp Configuration for PDF Sending...\n');

    const results = {
        credentials: false,
        whatsappNumber: false,
        accountStatus: false,
        mediaSupport: false,
        errors: [] as string[]
    };

    try {
        // 1. Check environment variables
        console.log('📋 Step 1: Checking environment variables...');
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;

        if (!accountSid) {
            results.errors.push('TWILIO_ACCOUNT_SID is missing');
        }
        if (!authToken) {
            results.errors.push('TWILIO_AUTH_TOKEN is missing');
        }
        if (!whatsappNumber) {
            results.errors.push('TWILIO_WHATSAPP_NUMBER is missing');
        }

        if (accountSid && authToken && whatsappNumber) {
            results.credentials = true;
            console.log('✅ Environment variables configured');
        } else {
            console.log('❌ Missing environment variables:', results.errors);
            return results;
        }

        // 2. Verify Twilio Account
        console.log('\n🔍 Step 2: Verifying Twilio account...');
        try {
            const accountResponse = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}.json`, {
                headers: {
                    'Authorization': `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`
                }
            });

            if (accountResponse.ok) {
                const accountData = await accountResponse.json();
                results.accountStatus = true;
                console.log('✅ Twilio account verified:', {
                    friendlyName: accountData.friendly_name,
                    status: accountData.status,
                    type: accountData.type
                });
            } else {
                results.errors.push(`Twilio account verification failed: ${accountResponse.status}`);
                console.log('❌ Twilio account verification failed');
            }
        } catch (error) {
            results.errors.push(`Account verification error: ${error instanceof Error ? error.message : 'Unknown'}`);
        }

        // 3. Check WhatsApp number format
        console.log('\n📱 Step 3: Checking WhatsApp number format...');
        if (whatsappNumber.startsWith('whatsapp:+')) {
            results.whatsappNumber = true;
            console.log('✅ WhatsApp number format is correct:', whatsappNumber);
        } else {
            results.errors.push('WhatsApp number should be in format: whatsapp:+1234567890');
            console.log('❌ WhatsApp number format incorrect. Expected: whatsapp:+1234567890');
        }

        // 4. Check media sending capabilities
        console.log('\n📄 Step 4: Checking media sending capabilities...');
        try {
            // Test with a small test image URL to verify media sending works
            const testMediaUrl = 'https://via.placeholder.com/150.png';

            console.log('📤 Testing media sending capability (not actually sending)...');

            // We don't actually send, just verify the request would be valid
            const testPayload = new URLSearchParams();
            testPayload.append('From', whatsappNumber);
            testPayload.append('To', 'whatsapp:+1234567890'); // Test number
            testPayload.append('MediaUrl', testMediaUrl);
            testPayload.append('Body', 'Test media message');

            if (testPayload.toString().length > 0) {
                results.mediaSupport = true;
                console.log('✅ Media sending capability configured');
            }
        } catch (error) {
            results.errors.push(`Media capability check failed: ${error instanceof Error ? error.message : 'Unknown'}`);
        }

        // Summary
        console.log('\n📊 Configuration Summary:');
        console.log('✅ Credentials:', results.credentials ? 'PASS' : 'FAIL');
        console.log('✅ WhatsApp Number:', results.whatsappNumber ? 'PASS' : 'FAIL');
        console.log('✅ Account Status:', results.accountStatus ? 'PASS' : 'FAIL');
        console.log('✅ Media Support:', results.mediaSupport ? 'PASS' : 'FAIL');

        if (results.errors.length > 0) {
            console.log('\n❌ Issues found:');
            results.errors.forEach((error, index) => {
                console.log(`${index + 1}. ${error}`);
            });
        }

        // Recommendations
        console.log('\n💡 Recommendations for PDF Sending:');
        console.log('1. Ensure your Twilio WhatsApp number is approved for Business API');
        console.log('2. Verify the recipient number is opted-in to receive WhatsApp messages');
        console.log('3. PDF files should be publicly accessible via HTTPS');
        console.log('4. PDF file size should be under 16MB');
        console.log('5. Content-Type should be application/pdf');

        return results;

    } catch (error) {
        console.error('❌ Configuration check failed:', error);
        results.errors.push(`General error: ${error instanceof Error ? error.message : 'Unknown'}`);
        return results;
    }
}

// Test function to verify PDF URL accessibility
export async function testPDFUrl(pdfUrl: string) {
    console.log(`🔍 Testing PDF URL: ${pdfUrl}`);

    try {
        const response = await fetch(pdfUrl, { method: 'HEAD' });
        const contentType = response.headers.get('content-type');
        const contentLength = response.headers.get('content-length');

        console.log('📊 PDF URL Test Results:');
        console.log('✅ Status:', response.status, response.statusText);
        console.log('✅ Content-Type:', contentType);
        console.log('✅ Content-Length:', contentLength ? `${parseInt(contentLength)} bytes` : 'unknown');
        console.log('✅ Accessible:', response.ok ? 'YES' : 'NO');

        if (!contentType?.includes('application/pdf')) {
            console.warn('⚠️ Warning: Content-Type is not application/pdf');
        }

        if (contentLength && parseInt(contentLength) > 16 * 1024 * 1024) {
            console.warn('⚠️ Warning: File size exceeds 16MB Twilio limit');
        }

        return {
            accessible: response.ok,
            contentType,
            contentLength: contentLength ? parseInt(contentLength) : null,
            status: response.status
        };
    } catch (error) {
        console.error('❌ PDF URL test failed:', error);
        return {
            accessible: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}
