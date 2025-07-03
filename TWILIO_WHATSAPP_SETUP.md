# Twilio WhatsApp Setup Guide for Betty Organic

## 🚀 Quick Setup

Betty Organic now uses **Twilio WhatsApp API** for automatic order notifications that work perfectly with Vercel production deployment!

### 1. Get Twilio Credentials

1. **Sign up/Login** to [Twilio Console](https://console.twilio.com/)
2. **Find your credentials** on the dashboard:
   - `Account SID` (starts with AC...)
   - `Auth Token` (click the eye icon to reveal)

### 2. Configure Environment Variables

Create a `.env.local` file in your project root:

```bash
# Twilio WhatsApp API Configuration
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
ADMIN_WHATSAPP_NUMBER=+251944113998

# Set Twilio as the WhatsApp provider
WHATSAPP_API_PROVIDER=twilio
```

### 3. WhatsApp Sandbox Setup

For **development/testing**:

1. Go to [Twilio Console → Messaging → Try it out → Send a WhatsApp message](https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn)
2. **Send "join" message** to `+1 415 523 8886` from your admin WhatsApp number
3. You'll receive a confirmation message - you're now connected to the sandbox!

### 4. Test the Integration

Run the test script:

```bash
node test-twilio-whatsapp.js
```

This will:
- ✅ Verify your Twilio credentials
- 📱 Send a test WhatsApp message
- 🧪 Simulate a full order notification

### 5. Production Setup (Optional)

For **production** (real business WhatsApp):

1. **Apply for WhatsApp Business API** through Twilio
2. **Get approved** (takes 1-7 days)
3. **Update** `TWILIO_WHATSAPP_FROM` with your approved business number
4. **Remove sandbox restrictions**

## 🔧 How It Works

1. **Customer places order** → Order created in database
2. **Server triggers notification** → `sendOrderNotificationWhatsApp()` called
3. **Twilio API sends WhatsApp** → Rich formatted message to admin
4. **Admin receives notification** → Can immediately process the order

## 🚀 Vercel Deployment

✅ **Twilio works perfectly with Vercel** because it's a simple HTTP API call
❌ **Baileys doesn't work with Vercel** because it needs persistent WebSocket connections

When you deploy to Vercel, automatic WhatsApp notifications will work seamlessly!

## 📱 Message Format

Your admin will receive beautifully formatted messages like:

```
🍎 NEW ORDER - Betty Organic

Order Details:
━━━━━━━━━━━━━━━━━━━━
📋 Order ID: BO-001234
👤 Customer: John Doe
📱 Phone: +251911223344
📧 Email: john@example.com
🏠 Address: 123 Main St, Addis Ababa

Products Ordered:
• Organic Apples (Qty: 2) - ETB 120.00
• Fresh Tomatoes (Qty: 1) - ETB 80.00

Financial Summary:
━━━━━━━━━━━━━━━━━━━━
💰 Subtotal: ETB 200.00
🚚 Delivery: ETB 50.00
💸 Discount: -ETB 10.00
Total Amount: ETB 240.00

Order Info:
━━━━━━━━━━━━━━━━━━━━
⏰ Time: Dec 18, 2024, 02:30 PM
🏷️ Status: PENDING
📦 Type: Customer Order

🚀 Action Required: Please process this order immediately!

💚 Betty Organic - Fresh & Healthy
```

## ⚠️ Troubleshooting

### "21614: Unverified number"
- **Solution**: Send "join" message to sandbox number first

### "20003: Authentication failed"
- **Solution**: Double-check your `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN`

### "21211: Invalid phone number"
- **Solution**: Use international format: `+251944113998` (not `0944113998`)

### "No message received"
- **Solution**: Check that the admin number is correctly set in `ADMIN_WHATSAPP_NUMBER`

## 🎯 Benefits

✅ **Vercel Compatible** - Works in serverless environment  
✅ **Instant Notifications** - Real-time order alerts  
✅ **Rich Formatting** - Beautiful, professional messages  
✅ **Reliable Delivery** - Enterprise-grade Twilio infrastructure  
✅ **Error Handling** - Comprehensive error reporting and fallbacks  
✅ **Easy Setup** - Just add 3 environment variables  

## 📞 Support

If you need help:
1. Run `node test-twilio-whatsapp.js` to diagnose issues
2. Check the console logs for detailed error messages
3. Verify your environment variables are correctly set
4. Ensure your WhatsApp number is connected to Twilio sandbox

---

🎉 **You're ready for automatic WhatsApp notifications on Vercel!**
