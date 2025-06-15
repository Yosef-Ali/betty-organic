// Simple test to your personal WhatsApp (if it's in the test numbers)

const https = require('https');

const token = 'EAAbDcsC1DywBO1CT6vfNcKJwBsz4NfX565XILUBPZBoxJe2Mp8sxiyYtMgqKlVAW2hr6awItQlk6ZBX8TpcxYLGvcOTS2llqrwdJAmxJM1c28SC2lxy9Yy0YEryuhFM4JnzKYQCbJ6H86wXyMJ87I3ZAZB4BtNtJBhwimmPcL59PPNvMHj20MZCwOa7DqtsU4G8jsJAFfy0fMTZB6vz0sAHGDZBXuyziNno';
const phoneId = '717322484789567';

// Try different phone numbers - replace with your test number
const testNumbers = [
  '251944113998',  // Your business number
  '15551234567',   // Example test number
  // Add your personal number here if it's added to test recipients
];

async function testNumber(phone) {
  return new Promise((resolve) => {
    const message = JSON.stringify({
      "messaging_product": "whatsapp",
      "to": phone,
      "type": "template",
      "template": {
        "name": "hello_world",
        "language": { "code": "en_US" }
      }
    });

    const options = {
      hostname: 'graph.facebook.com',
      port: 443,
      path: `/v23.0/${phoneId}/messages`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(message)
      }
    };

    console.log(`📱 Testing ${phone}...`);

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log(`✅ SUCCESS with ${phone}! Check WhatsApp!`);
          resolve(true);
        } else {
          const error = JSON.parse(data);
          console.log(`❌ ${phone}: ${error.error.message}`);
          resolve(false);
        }
      });
    });

    req.on('error', (e) => {
      console.log(`❌ ${phone}: ${e.message}`);
      resolve(false);
    });

    req.write(message);
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Testing WhatsApp with hello_world template...\n');
  
  for (const phone of testNumbers) {
    await testNumber(phone);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between tests
  }
  
  console.log('\n📋 If all failed, you need to:');
  console.log('1. Add test numbers in Meta Developer Console');
  console.log('2. Or use the business verification (but that takes time)');
  console.log('\n💡 For now, your app works with manual URLs - that\'s fine!');
}

runTests();