# WhatsApp Cloud API Integration Guide - Betty Organic

## ✅ Integration Complete!

Your Betty Organic App now supports **WhatsApp Cloud API** (Meta Business API) in addition to your existing WhatsApp integration methods.

## 🚀 What's Been Added

### 1. **Environment Variables** (Updated in `.env.local`)
```env
# WhatsApp Cloud API (Meta Business API)
WHATSAPP_ACCESS_TOKEN=YOUR_TEMPORARY_ACCESS_TOKEN_FROM_META
WHATSAPP_PHONE_NUMBER_ID=YOUR_PHONE_NUMBER_ID_FROM_META
WEBHOOK_VERIFY_TOKEN=your_custom_webhook_verification_token
WHATSAPP_API_PROVIDER=cloud-api
```

### 2. **New API Routes**
- **`/api/whatsapp/send`** - Send WhatsApp messages via Cloud API
- **`/api/whatsapp/webhook`** - Handle incoming webhooks from Meta

### 3. **Updated WhatsApp Actions**
- Added `sendCloudApiWhatsApp()` function
- Updated to support `cloud-api` provider
- Automatic fallback to manual mode if API fails

### 4. **Enhanced Settings UI**
- Added Cloud API option in dashboard settings
- Configuration fields for Access Token and Phone Number ID
- Setup instructions and validation

### 5. **Test Tools**
- **`/whatsapp-test`** - Dedicated test page for Cloud API
- Test component with real-time feedback
- Connection testing and message sending

## 🛠️ Setup Instructions

### Step 1: Meta Developer Setup
1. Go to [developers.facebook.com](https://developers.facebook.com)
2. Create or select your Facebook App
3. Add **WhatsApp** product to your app
4. Attach your Meta Business Account

### Step 2: Get Credentials
1. Navigate to **WhatsApp > API Setup** in your app dashboard
2. Copy the **Temporary Access Token**
3. Copy the **Phone Number ID**
4. Add test recipients (up to 5 phone numbers)

### Step 3: Update Environment Variables
```bash
# Edit your .env.local file
WHATSAPP_ACCESS_TOKEN=EAAxxxxxxxxxxxx...
WHATSAPP_PHONE_NUMBER_ID=102xxxxxxxxxx
WEBHOOK_VERIFY_TOKEN=your_secret_webhook_token
WHATSAPP_API_PROVIDER=cloud-api
```

### Step 4: Test the Integration
1. Visit `http://localhost:3000/whatsapp-test`
2. Enter a test recipient number
3. Send a test message
4. Check if the message is received

### Step 5: Configure in Dashboard
1. Go to **Dashboard → Settings → WhatsApp**
2. Select **"WhatsApp Cloud API (Meta)"** as the provider
3. Enter your Access Token and Phone Number ID
4. Save settings and test

## 📱 How It Works

### For Order Notifications
When a customer places an order, the system will:

1. **Try Cloud API first** (if configured)
   - Send automatic WhatsApp notification to admin
   - No user interaction required
   - Message delivery tracking

2. **Fallback to Manual** (if API fails)
   - Generate WhatsApp URL with pre-filled message
   - User clicks to open WhatsApp
   - User manually sends the message

### Message Format
```
🍎 *NEW ORDER - Betty Organic*

*Order ID:* BO001234
*Customer:* John Doe
*Phone:* +251912345678
*Delivery Address:* 123 Main St, Addis Ababa

*Items:*
• Organic Apples (500g) - ETB 45.00
• Fresh Spinach (250g) - ETB 25.00

*Total Amount:* ETB 70.00
*Order Time:* 12/6/2025, 2:30:45 PM

Please process this order as soon as possible! 🚚
```

## 🔧 API Endpoints

### Send Message
```bash
POST /api/whatsapp/send
Content-Type: application/json

{
  "to": "+251912345678",
  "message": "Hello from Betty Organic!",
  "type": "text"
}
```

### Webhook (for production)
```bash
GET /api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=CHALLENGE
POST /api/whatsapp/webhook
```

## ⚙️ Configuration Options

### API Provider Options
- **`cloud-api`** - WhatsApp Cloud API (Meta) - **NEW!**
- **`manual`** - Manual URL generation (Free)
- **`twilio`** - Twilio WhatsApp API
- **`whatsapp-web-js`** - WhatsApp Web.js service
- **`baileys`** - Baileys service

### Environment Variables
```env
# Required for Cloud API
WHATSAPP_ACCESS_TOKEN=EAAxxxxx...
WHATSAPP_PHONE_NUMBER_ID=102xxxxx...
WEBHOOK_VERIFY_TOKEN=your_secret

# General settings
ADMIN_WHATSAPP_NUMBER=+251947385509
WHATSAPP_API_PROVIDER=cloud-api
```

## 🚨 Important Notes

### Testing Phase
- **Use temporary access token** for development
- **Add test recipients** in Meta Developer Console
- **Maximum 5 test recipients** during development
- **Messages only work with verified test numbers**

### Production Setup
- **Apply for WhatsApp Business API approval**
- **Get permanent access token**
- **Configure webhook URL** for your production domain
- **Set up proper error handling and logging**

### Webhook Configuration
When moving to production, configure webhook URL:
```
https://your-domain.com/api/whatsapp/webhook
```

## 🔍 Testing & Debugging

### Test Page
Visit: `http://localhost:3000/whatsapp-test`

Features:
- Send test messages
- Test connection
- View real-time results
- Technical details for debugging

### Dashboard Testing
1. Go to **Dashboard → Settings → WhatsApp**
2. Configure Cloud API settings
3. Click **"Test WhatsApp"** button
4. Check if admin receives the message

### Logs & Debugging
- Check browser console for API responses
- Server logs show message sending attempts
- Error messages include specific failure reasons

## 🔄 Migration from Existing Setup

Your existing WhatsApp integrations will continue to work. The Cloud API is an additional option that:

- **Doesn't break existing functionality**
- **Provides automatic message sending**
- **Falls back to manual method if needed**
- **Can be enabled/disabled via settings**

## 📊 Benefits of Cloud API

### Compared to Manual Method
- ✅ **Automatic sending** - No user interaction required
- ✅ **Delivery tracking** - Know if messages were delivered
- ✅ **Professional integration** - Direct from Meta
- ✅ **Webhook support** - Handle replies and status updates

### Compared to Twilio
- ✅ **Direct from Meta** - Official WhatsApp provider
- ✅ **Potentially lower costs** - Competitive pricing
- ✅ **Better integration** - Native WhatsApp features
- ✅ **More features** - Rich messages, templates, etc.

## 🛡️ Security & Best Practices

### Token Security
- Keep access tokens secret
- Don't commit tokens to version control
- Rotate tokens regularly
- Use environment variables only

### Webhook Security
- Use HTTPS for webhook URLs
- Implement proper verification
- Log webhook events for monitoring
- Handle errors gracefully

### Rate Limiting
- Respect Meta's rate limits
- Implement retry logic with backoff
- Monitor usage and quotas
- Cache frequent requests

## 🚀 Next Steps

1. **Set up Meta Developer Account**
2. **Get your credentials and test**
3. **Configure in dashboard settings**
4. **Place a test order to verify**
5. **Apply for production approval**
6. **Configure webhook for production**

Your WhatsApp Cloud API integration is now ready! 🎉
