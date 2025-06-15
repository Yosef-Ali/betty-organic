// Test script to send image invoice to WhatsApp
// Run this in your browser console on http://localhost:3000

async function testImageWhatsApp() {
    console.log('🧪 Testing Image WhatsApp Sending...');

    const testData = {
        customerPhone: '+251911234567', // Replace with your test phone number
        customerName: 'Test Customer',
        orderId: `TEST-${Date.now()}`,
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

    try {
        // Import the function (this works in browser console on the test page)
        const { sendImageInvoiceWhatsApp } = await import('/app/actions/whatsappActions');

        const result = await sendImageInvoiceWhatsApp(testData);

        console.log('📱 WhatsApp Image Test Result:', result);

        if (result.success) {
            console.log('✅ Image sent successfully!');
            console.log('📸 Image URL:', result.imageUrl);
            console.log('📱 Message ID:', result.messageId);
        } else {
            console.log('❌ Failed:', result.error);
            if (result.whatsappUrl) {
                console.log('🔗 Manual WhatsApp URL:', result.whatsappUrl);
            }
        }
    } catch (error) {
        console.error('💥 Test failed:', error);
    }
}

// Run the test
testImageWhatsApp();
