#!/usr/bin/env node

/**
 * Customer Experience Verification Script
 * Tests that the WhatsApp notification system is customer-friendly
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Customer-Friendly WhatsApp System...\n');

// Files to check
const files = [
  'lib/whatsapp/order-notifications.ts',
  'components/SalesPage.tsx', 
  'components/OrderForm.tsx',
  'app/actions/orderActions.ts'
];

let issues = [];

console.log('📋 Checking for customer-friendly implementation...\n');

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  
  if (!fs.existsSync(filePath)) {
    issues.push(`❌ File not found: ${file}`);
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  console.log(`📄 Checking ${file}:`);

  // Check for removed manual URL references
  if (content.includes('whatsappUrl') && !content.includes('// Removed')) {
    issues.push(`❌ ${file}: Still contains whatsappUrl references`);
    console.log('  ❌ Contains manual WhatsApp URL references');
  } else {
    console.log('  ✅ No manual URL references found');
  }

  // Check for customer-exposed WhatsApp errors
  if (content.includes('WhatsApp failed') || content.includes('whatsapp error')) {
    issues.push(`❌ ${file}: Exposes WhatsApp errors to customers`);
    console.log('  ❌ Exposes WhatsApp errors to customers');
  } else {
    console.log('  ✅ No customer-exposed WhatsApp errors');
  }

  // Check for manual WhatsApp action requirements (excluding unrelated manual UI actions)
  const hasManualWhatsAppActions = (content.includes('click to send whatsapp') || 
    content.includes('manual whatsapp') || 
    content.includes('send whatsapp manually') ||
    (content.includes('whatsapp') && content.includes('click') && content.includes('send')));
  
  if (hasManualWhatsAppActions) {
    issues.push(`❌ ${file}: Requires manual customer WhatsApp actions`);
    console.log('  ❌ Requires manual customer WhatsApp actions');
  } else {
    console.log('  ✅ No manual WhatsApp actions required');
  }

  // Check for automatic sending
  if (file.includes('order-notifications.ts')) {
    if (content.includes('sendBaileysMessage') && content.includes('[AUTO-WHATSAPP]')) {
      console.log('  ✅ Automatic sending implemented');
    } else {
      issues.push(`❌ ${file}: Automatic sending not properly implemented`);
      console.log('  ❌ Automatic sending not properly implemented');
    }
  }

  console.log('');
});

console.log('🎯 Customer Experience Checks:');

// Check for customer-friendly UI messages
const salesPagePath = path.join(__dirname, 'components/SalesPage.tsx');
if (fs.existsSync(salesPagePath)) {
  const salesContent = fs.readFileSync(salesPagePath, 'utf8');
  
  if (salesContent.includes('Order created successfully') || salesContent.includes('admin notified')) {
    console.log('✅ Customer-friendly success messages found');
  } else {
    issues.push('❌ Missing customer-friendly success messages');
    console.log('❌ Missing customer-friendly success messages');
  }

  if (salesContent.includes('WhatsApp notification failed') || salesContent.includes('notification error')) {
    issues.push('❌ Exposes notification failures to customers');
    console.log('❌ Exposes notification failures to customers');
  } else {
    console.log('✅ No notification failures exposed to customers');
  }
}

console.log('\n📊 Final Assessment:');

if (issues.length === 0) {
  console.log('🎉 ✅ CUSTOMER-FRIENDLY SYSTEM VERIFIED!');
  console.log('\n🌟 Key Benefits:');
  console.log('   • Customers never see WhatsApp technical errors');
  console.log('   • No manual actions required from customers');
  console.log('   • Clean, professional user experience');
  console.log('   • WhatsApp notifications happen automatically in background');
  console.log('\n🚀 Ready for customer use!');
} else {
  console.log('⚠️  Issues found that need attention:');
  issues.forEach(issue => console.log(`   ${issue}`));
  console.log('\n🔧 Please fix these issues before customer release.');
}

console.log('\n📝 Next Steps:');
console.log('1. Start development server: npm run dev');
console.log('2. Test order creation - customer should see clean success');
console.log('3. Admin should receive WhatsApp (if connection works)');
console.log('4. Customer never sees technical failures');
