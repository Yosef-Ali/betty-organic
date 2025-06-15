const https = require('https');

// Simple test - just like the curl command you showed me
const token = 'EAAbDcsC1DywBO1CT6vfNcKJwBsz4NfX565XILUBPZBoxJe2Mp8sxiyYtMgqKlVAW2hr6awItQlk6ZBX8TpcxYLGvcOTS2llqrwdJAmxJM1c28SC2lxy9Yy0YEryuhFM4JnzKYQCbJ6H86wXyMJ87I3ZAZB4BtNtJBhwimmPcL59PPNvMHj20MZCwOa7DqtsU4G8jsJAFfy0fMTZB6vz0sAHGDZBXuyziNno';
const phoneId = '717322484789567';
const toPhone = '251944113998';

const message = JSON.stringify({
  "messaging_product": "whatsapp",
  "to": toPhone,
  "type": "text",
  "text": { "body": "🧪 Auto test from Betty Organic!" }
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

console.log('🚀 Sending WhatsApp message...');

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    if (res.statusCode === 200) {
      console.log('✅ SUCCESS! Message sent!');
      console.log('📱 Check your WhatsApp now!');
    } else {
      console.log('❌ Failed:', res.statusCode);
      console.log('Response:', data);
    }
  });
});

req.on('error', (e) => console.log('❌ Error:', e.message));
req.write(message);
req.end();