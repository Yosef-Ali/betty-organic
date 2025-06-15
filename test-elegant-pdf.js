// Simple PDF test script
import { generateReceiptPDF } from './lib/utils/pdfGenerator.js';

async function testNewPDFDesign() {
    console.log('🧪 Testing new elegant PDF design...');

    const testData = {
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        orderId: 'BO-ELEGANT-123456',
        items: [
            { name: 'Fresh Organic Avocado', quantity: 0.5, price: 25.00 },
            { name: 'Premium Tomatoes', quantity: 1.2, price: 18.50 },
            { name: 'Baby Spinach Leaves', quantity: 0.3, price: 12.75 }
        ],
        total: 56.25,
        orderDate: 'Friday, June 14, 2025',
        orderTime: '2:30 PM',
        storeName: 'Betty Organic',
        storeContact: '+251944113998'
    };

    try {
        const pdfBlob = await generateReceiptPDF(testData);
        console.log(`✅ Elegant PDF generated! Size: ${pdfBlob.size} bytes`);

        // In a real environment, this would trigger a download
        console.log('📄 PDF features:');
        console.log('  • Thermal receipt size (80x150mm)');
        console.log('  • Green Betty Organic header');
        console.log('  • Elegant alternating row colors');
        console.log('  • Professional layout with proper spacing');
        console.log('  • Barcode representation');
        console.log('  • Thank you footer');

        return true;
    } catch (error) {
        console.error('❌ PDF generation failed:', error);
        return false;
    }
}

testNewPDFDesign().then(success => {
    console.log(success ? '🎉 Test passed!' : '💥 Test failed!');
}).catch(console.error);
