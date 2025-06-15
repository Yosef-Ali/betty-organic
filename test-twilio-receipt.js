// Test script for Twilio WhatsApp receipt functionality
// Run this in your browser console after starting the dev server

async function testTwilioWhatsAppReceipt() {
    console.log('🧪 Testing Twilio WhatsApp Receipt...');

    const testData = {
        customerPhone: '+251944113998', // Replace with a test phone number
        customerName: 'Test Customer',
        orderId: 'BO-TEST-' + Date.now(),
        items: [
            { name: 'Orange', quantity: 1, price: 350.00 },
            { name: 'Eggplant', quantity: 1, price: 150.00 },
            { name: 'Green chille', quantity: 1, price: 200.00 }
        ],
        total: 700.00,
        orderDate: new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }),
        orderTime: new Date().toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        }),
        storeName: 'Betty Organic',
        storeContact: '+251944113998'
    };

    try {
        // This would be called from the client-side
        const response = await fetch('/api/test-twilio-receipt', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testData)
        });

        const result = await response.json();

        if (result.success) {
            console.log('✅ Test receipt sent successfully!');
            console.log('Message ID:', result.messageId);
            console.log('Provider:', result.provider);
            if (result.whatsappUrl) {
                console.log('Fallback URL:', result.whatsappUrl);
            }
        } else {
            console.error('❌ Test failed:', result.error);
        }
    } catch (error) {
        console.error('❌ Test error:', error);
    }
}

// Uncomment to run the test
// testTwilioWhatsAppReceipt();

console.log('📝 Twilio WhatsApp Receipt Test Ready');
console.log('To test: testTwilioWhatsAppReceipt()');
