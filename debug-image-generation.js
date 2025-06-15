#!/usr/bin/env node

// Test the image generation API directly
const testData = {
    customerName: 'Test Customer',
    orderId: 'TEST-' + Date.now(),
    items: [
        { name: 'Fresh Avocado', quantity: 0.5, price: 25.00 },
        { name: 'Organic Tomatoes', quantity: 1.0, price: 15.50 }
    ],
    total: 40.50,
    orderDate: new Date().toLocaleDateString(),
    orderTime: new Date().toLocaleTimeString(),
    storeName: 'Betty Organic',
    storeContact: '+251944113998'
};

async function testImageGeneration() {
    console.log('🧪 Testing receipt image generation API...\n');
    
    try {
        const response = await fetch('http://localhost:3000/api/generate-receipt-image', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testData),
        });

        console.log('📤 API Response Status:', response.status);
        console.log('📤 API Response Headers:', Object.fromEntries(response.headers.entries()));

        if (response.ok) {
            const result = await response.json();
            console.log('✅ Image generation successful!');
            console.log('📊 Response data:', {
                success: result.success,
                contentType: result.contentType,
                filename: result.filename,
                method: result.method,
                imageDataLength: result.imageBase64 ? result.imageBase64.length : 0
            });
            
            if (result.dataUrl) {
                console.log('🔗 Data URL preview:', result.dataUrl.substring(0, 100) + '...');
            }
        } else {
            const errorText = await response.text();
            console.log('❌ Image generation failed:', response.status, errorText);
        }
    } catch (error) {
        console.error('💥 Test failed:', error.message);
    }
}

async function testImageUpload() {
    console.log('\n🧪 Testing image upload API...\n');
    
    // Create a simple test image (1x1 PNG in base64)
    const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
    
    try {
        const response = await fetch('http://localhost:3000/api/temp-image', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true'
            },
            body: JSON.stringify({
                imageData: testImageBase64,
                filename: 'test-image.png'
            }),
        });

        console.log('📤 Upload Response Status:', response.status);

        if (response.ok) {
            const result = await response.json();
            console.log('✅ Image upload successful!');
            console.log('📊 Upload result:', result);
            
            // Test accessing the uploaded image
            if (result.url) {
                console.log('\n🔍 Testing image access...');
                const imageResponse = await fetch(result.url);
                console.log('📥 Image access status:', imageResponse.status);
                console.log('📥 Image headers:', Object.fromEntries(imageResponse.headers.entries()));
            }
        } else {
            const errorText = await response.text();
            console.log('❌ Image upload failed:', response.status, errorText);
        }
    } catch (error) {
        console.error('💥 Upload test failed:', error.message);
    }
}

// Run tests
console.log('🚀 Starting image pipeline tests...\n');
testImageGeneration().then(() => testImageUpload()).then(() => {
    console.log('\n✅ All tests completed!');
}).catch(console.error);