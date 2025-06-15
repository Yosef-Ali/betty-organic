// Simple WhatsApp test without TypeScript modules

const adminPhone = '+251944113998';

const testMessage = `🧪 *Test Message - Betty Organic*

This is a test message from your Betty Organic WhatsApp integration.

Provider: manual
Time: ${new Date().toLocaleString()}

If you received this message, your WhatsApp integration is working correctly! ✅`;

// Generate WhatsApp URL
const cleanPhone = adminPhone.replace('+', '');
const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(testMessage)}`;

console.log('📱 WhatsApp Test Message Ready!');
console.log('');
console.log('Admin Phone:', adminPhone);
console.log('');
console.log('WhatsApp URL:');
console.log(whatsappUrl);
console.log('');
console.log('✅ Click the URL above to open WhatsApp with the test message!');
console.log('📱 Or scan this in your mobile browser to test.');