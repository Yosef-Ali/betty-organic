#!/usr/bin/env node

// Test if Twilio can access the image URLs we generate
console.log('🧪 Testing Twilio Image Access Pipeline...\n');

async function testFullPipeline() {
    const testData = {
        customerName: 'Test Customer',
        orderId: 'TEST-' + Date.now(),
        items: [
            { name: 'Fresh Avocado', quantity: 0.5, price: 25.00 }
        ],
        total: 25.00,
        orderDate: new Date().toLocaleDateString(),
        orderTime: new Date().toLocaleTimeString()
    };

    try {
        // Step 1: Generate image
        console.log('📸 Step 1: Generating image...');
        const imageResponse = await fetch('http://localhost:3000/api/generate-receipt-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testData)
        });

        if (!imageResponse.ok) {
            throw new Error(`Image generation failed: ${imageResponse.status}`);
        }

        const imageResult = await imageResponse.json();
        console.log('✅ Image generated:', {
            success: imageResult.success,
            contentType: imageResult.contentType,
            filename: imageResult.filename,
            dataLength: imageResult.imageBase64?.length || 0
        });

        // Step 2: Upload to temp storage
        console.log('\n📤 Step 2: Uploading to temp storage...');
        const uploadResponse = await fetch('http://localhost:3000/api/temp-image', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true'
            },
            body: JSON.stringify({
                imageData: imageResult.imageBase64,
                filename: imageResult.filename
            })
        });

        if (!uploadResponse.ok) {
            throw new Error(`Upload failed: ${uploadResponse.status}`);
        }

        const uploadResult = await uploadResponse.json();
        console.log('✅ Image uploaded:', uploadResult);

        // Step 3: Test image access (simulate what Twilio does)
        console.log('\n🔍 Step 3: Testing image access (simulating Twilio)...');
        const imageUrl = uploadResult.url;
        const accessResponse = await fetch(imageUrl, {
            headers: {
                'User-Agent': 'TwilioProxy/1.1', // Simulate Twilio's user agent
                'Accept': '*/*'
            }
        });

        console.log('📥 Image access result:', {
            status: accessResponse.status,
            statusText: accessResponse.statusText,
            headers: Object.fromEntries(accessResponse.headers.entries()),
            size: accessResponse.headers.get('content-length')
        });

        if (!accessResponse.ok) {
            throw new Error(`Image access failed: ${accessResponse.status} ${accessResponse.statusText}`);
        }

        // Step 4: Check the actual image data
        const imageBuffer = await accessResponse.arrayBuffer();
        console.log('✅ Image data accessible:', {
            size: imageBuffer.byteLength,
            firstBytes: Array.from(new Uint8Array(imageBuffer.slice(0, 10))).map(b => b.toString(16)).join(' ')
        });

        console.log('\n🎯 PIPELINE TEST RESULT: ✅ SUCCESS');
        console.log('📊 Summary:');
        console.log('  - Image generation: ✅ Working');
        console.log('  - Image upload: ✅ Working');
        console.log('  - Image access: ✅ Working');
        console.log('  - Twilio compatibility: ✅ Should work');
        console.log('\n💡 The image pipeline is working correctly!');
        console.log('   If WhatsApp still isn\'t receiving images, the issue might be:');
        console.log('   1. Twilio account permissions');
        console.log('   2. WhatsApp number configuration');
        console.log('   3. Image format/content-type handling');

    } catch (error) {
        console.error('\n❌ PIPELINE TEST FAILED:', error.message);
        console.log('\n💡 This explains why WhatsApp images aren\'t working.');
    }
}

testFullPipeline();