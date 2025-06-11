# WhatsApp Notification Troubleshooting Guide

## 🔍 Why You're Not Receiving Notifications

Based on your setup, here are the most likely reasons:

### 1. **WhatsApp Cloud API Token Issues**
Your access token might be:
- ❌ Expired (temporary tokens expire in 24 hours)
- ❌ Invalid for your phone number
- ❌ Not configured for your test recipient

### 2. **Test Recipients Not Added**
WhatsApp Cloud API requires you to add test recipients in Meta Developer Console.

### 3. **Phone Number Format**
The system is trying to send to: `+251947385509`
Make sure this number is added as a test recipient.

## ✅ **How to Fix:**

### Step 1: Check Your Meta Developer Console
1. Go to https://developers.facebook.com/apps
2. Select your Betty Organic app
3. Go to WhatsApp → API Setup
4. Check if `+251947385509` is in the "To" field test recipients

### Step 2: Get Fresh Access Token
1. In Meta Developer Console → WhatsApp → API Setup
2. Copy the new temporary access token
3. Update your `.env.local` file with the new token

### Step 3: Test the Integration
I've created a test endpoint for you:

```bash
# Start your development server
npm run dev

# Test WhatsApp configuration (in new terminal)
curl http://localhost:3000/api/test-whatsapp

# Test sending notification
curl -X POST http://localhost:3000/api/test-whatsapp
```

### Step 4: Manual Fallback Test
If the API doesn't work, the system should show a manual WhatsApp button. Click it to test if the URL generation works.

## 🚨 **Quick Fix Options:**

### Option 1: Use Manual Mode (Immediate)
Set this in your `.env.local`:
```
WHATSAPP_API_PROVIDER=manual
```
This will always show the manual WhatsApp button with pre-filled messages.

### Option 2: Fix Cloud API (Recommended)
1. Add your phone number (+251947385509) as test recipient
2. Get fresh access token
3. Update environment variables
4. Restart development server

## 📱 **Test Results Expected:**

### Successful API Integration:
- Status: "Admin automatically notified via WhatsApp" ✅
- Button: Green checkmark (disabled)

### Manual Fallback:
- Status: "Manual notification available below" ⚠️
- Button: WhatsApp icon (clickable)

### Failed:
- Status: "Auto-notification failed - use manual option" ❌
- Button: WhatsApp icon (retry)

## 🔧 **Debug Commands:**

```bash
# Check environment variables
echo $WHATSAPP_ACCESS_TOKEN
echo $WHATSAPP_PHONE_NUMBER_ID
echo $ADMIN_WHATSAPP_NUMBER

# Test API endpoint directly
curl -X POST http://localhost:3000/api/whatsapp/send \
  -H "Content-Type: application/json" \
  -d '{"to":"+251947385509","message":"Test from Betty Organic","type":"text"}'
```

## 📞 **Next Steps:**

1. **Test Manual Mode First** - Set `WHATSAPP_API_PROVIDER=manual` to ensure the system works
2. **Check Meta Console** - Verify your app setup and test recipients
3. **Update Tokens** - Get fresh access token if needed
4. **Test Order Flow** - Place a test order to see the notification system in action

The system is designed to gracefully fall back to manual mode if the API fails, so users will always be able to notify the admin one way or another.