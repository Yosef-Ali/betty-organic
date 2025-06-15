// Test script to verify PDF generation and WhatsApp sending functionality
// Run with: node test-pdf-whatsapp.js

import { generateReceiptPDF } from './lib/utils/pdfGenerator.js';
import { sendPDFReceiptWhatsApp } from './app/actions/whatsappActions.js';

async function testPDFWhatsAppIntegration() {
    console.log('🧪 Testing PDF generation and WhatsApp sending...\n');

    // Test data - similar to what would come from the order receipt modal
    const testReceiptData = {
        customerName: 'Test Customer',
        customerEmail: 'test@example.com',
        orderId: 'BO-TEST-123456',
        items: [
            { name: 'Fresh Avocado', quantity: 0.5, price: 25.00 },
            { name: 'Organic Tomatoes', quantity: 1.0, price: 15.50 },
            { name: 'Green Spinach', quantity: 0.3, price: 12.75 }
        ],
        total: 53.25,
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
        // Step 1: Test PDF generation
        console.log('📄 Step 1: Testing PDF generation...');
        const pdfBlob = await generateReceiptPDF(testReceiptData);
        console.log(`✅ PDF generated successfully! Size: ${pdfBlob.size} bytes`);

        // Step 2: Convert PDF to base64 for WhatsApp sending
        console.log('\n🔄 Step 2: Converting PDF to base64...');
        const pdfBase64 = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = (reader.result).split(',')[1];
                resolve(base64String);
            };
            reader.readAsDataURL(pdfBlob);
        });
        console.log(`✅ PDF converted to base64! Length: ${pdfBase64.length} characters`);

        // Step 3: Test WhatsApp PDF sending (uncomment to test with real phone number)
        /*
        console.log('\n📱 Step 3: Testing WhatsApp PDF sending...');
        const whatsappResult = await sendPDFReceiptWhatsApp({
          customerPhone: '+251944113998', // Replace with test phone number
          customerName: testReceiptData.customerName,
          orderId: testReceiptData.orderId,
          pdfBase64,
          items: testReceiptData.items,
          total: testReceiptData.total,
          orderDate: testReceiptData.orderDate,
          orderTime: testReceiptData.orderTime,
          storeName: testReceiptData.storeName,
          storeContact: testReceiptData.storeContact
        });
    
        if (whatsappResult.success) {
          console.log('✅ WhatsApp PDF sent successfully!');
          console.log('📄 Method:', whatsappResult.pdfUrl ? 'PDF Document Attachment' : 'Text Message');
          if (whatsappResult.pdfUrl) {
            console.log('🔗 PDF URL:', whatsappResult.pdfUrl);
          }
          if (whatsappResult.whatsappUrl) {
            console.log('🔗 Fallback WhatsApp URL:', whatsappResult.whatsappUrl);
          }
        } else {
          console.error('❌ WhatsApp PDF sending failed:', whatsappResult.error);
        }
        */

        console.log('\n🎯 Test Summary:');
        console.log('✅ PDF Generation: Working');
        console.log('✅ Base64 Conversion: Working');
        console.log('⏸️  WhatsApp Sending: Skipped (uncomment to test)');
        console.log('\n💡 To test WhatsApp sending:');
        console.log('1. Uncomment the WhatsApp test section above');
        console.log('2. Replace the phone number with a valid test number');
        console.log('3. Ensure Twilio credentials are properly configured');
        console.log('4. Run the test again');

    } catch (error) {
        console.error('❌ Test failed:', error);
        console.error('Stack:', error.stack);
    }
}

// Run the test
testPDFWhatsAppIntegration().catch(console.error);
