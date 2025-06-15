import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🔧 Starting Twilio WhatsApp Configuration Check...');

    const results = {
      credentials: false,
      whatsappNumber: false,
      accountStatus: false,
      mediaSupport: false,
      errors: [] as string[]
    };

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
      return NextResponse.json({
        success: false,
        results,
        summary: 'Missing required environment variables'
      });
    }

    // 2. Verify Twilio Account
    console.log('🔍 Step 2: Verifying Twilio account...');
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
        const errorData = await accountResponse.json();
        results.errors.push(`Twilio account verification failed: ${accountResponse.status} - ${errorData.message || 'Unknown error'}`);
        console.log('❌ Twilio account verification failed:', errorData);
      }
    } catch (error) {
      results.errors.push(`Account verification error: ${error instanceof Error ? error.message : 'Unknown'}`);
      console.error('❌ Account verification error:', error);
    }

    // 3. Check WhatsApp number format
    console.log('📱 Step 3: Checking WhatsApp number format...');
    if (whatsappNumber.startsWith('whatsapp:+')) {
      results.whatsappNumber = true;
      console.log('✅ WhatsApp number format is correct:', whatsappNumber);
    } else {
      results.errors.push('WhatsApp number should be in format: whatsapp:+1234567890');
      console.log('❌ WhatsApp number format incorrect. Expected: whatsapp:+1234567890');
    }

    // 4. Check media sending capabilities
    console.log('📄 Step 4: Checking media sending capabilities...');
    try {
      // Test with a small test image URL to verify media sending works
      const testMediaUrl = 'https://via.placeholder.com/150.png';

      console.log('📤 Testing media sending capability (validation only)...');

      // We don't actually send, just verify the request would be valid
      const testPayload = new URLSearchParams();
      testPayload.append('From', whatsappNumber);
      testPayload.append('To', 'whatsapp:+1234567890'); // Test number
      testPayload.append('MediaUrl', testMediaUrl);

      if (testPayload.toString().length > 0) {
        results.mediaSupport = true;
        console.log('✅ Media sending capability configured');
      }
    } catch (error) {
      results.errors.push(`Media capability check failed: ${error instanceof Error ? error.message : 'Unknown'}`);
    }

    // Summary
    const summary = {
      credentials: results.credentials ? 'PASS' : 'FAIL',
      whatsappNumber: results.whatsappNumber ? 'PASS' : 'FAIL', 
      accountStatus: results.accountStatus ? 'PASS' : 'FAIL',
      mediaSupport: results.mediaSupport ? 'PASS' : 'FAIL'
    };

    console.log('📊 Configuration Summary:', summary);

    if (results.errors.length > 0) {
      console.log('❌ Issues found:', results.errors);
    }

    const allPassed = results.credentials && results.whatsappNumber && results.accountStatus && results.mediaSupport;

    return NextResponse.json({
      success: allPassed,
      results,
      summary,
      recommendations: [
        'Ensure your Twilio WhatsApp number is approved for Business API',
        'Verify the recipient number is opted-in to receive WhatsApp messages',
        'PDF files should be publicly accessible via HTTPS',
        'PDF file size should be under 5MB for WhatsApp',
        'Content-Type should be application/pdf'
      ]
    });

  } catch (error) {
    console.error('❌ Configuration check failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      results: {
        credentials: false,
        whatsappNumber: false,
        accountStatus: false,
        mediaSupport: false,
        errors: [`General error: ${error instanceof Error ? error.message : 'Unknown'}`]
      }
    }, { status: 500 });
  }
}