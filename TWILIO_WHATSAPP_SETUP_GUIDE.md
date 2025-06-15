# 🔧 Twilio WhatsApp PDF Sending - Configuration Guide

## 📋 Prerequisites for PDF Document Sending

### 1. **Twilio Account Requirements**
- ✅ **Twilio Account** with WhatsApp Business API access
- ✅ **WhatsApp Business Account** (not personal WhatsApp)
- ✅ **Approved WhatsApp Business Profile** 
- ✅ **Verified WhatsApp Sender Number**

### 2. **Environment Configuration**
Required in `.env.local`:
```bash
TWILIO_ACCOUNT_SID=AC... (Your Account SID)
TWILIO_AUTH_TOKEN=... (Your Auth Token) 
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886 (Your WhatsApp number)
WHATSAPP_API_PROVIDER=twilio
```

### 3. **WhatsApp Business API Approval**
❗ **CRITICAL**: Your Twilio WhatsApp number must be:
- Approved for **Business API** (not Sandbox)
- Approved for **Media Sending** capability
- Have **opt-in consent** from recipients

## 🚨 Common Issues & Solutions

### Issue 1: "WhatsApp number not verified"
**Problem**: Trying to send from unapproved number
**Solution**: 
1. Go to Twilio Console → WhatsApp → Senders
2. Verify your business profile is approved
3. Check if media sending is enabled

### Issue 2: "Media URL not accessible" 
**Problem**: PDF URL cannot be accessed by Twilio
**Solution**:
1. Ensure PDF URL is publicly accessible via HTTPS
2. Check CORS headers allow external access
3. Verify Content-Type is `application/pdf`

### Issue 3: "Invalid recipient number"
**Problem**: Recipient hasn't opted-in to receive messages
**Solution**:
1. Recipient must send a message to your WhatsApp Business number first
2. Or use Twilio's opt-in API to get consent

### Issue 4: "File too large"
**Problem**: PDF exceeds Twilio's 16MB limit
**Solution**: Optimize PDF size or split into smaller files

## 🔍 Verification Steps

### Step 1: Check Twilio Account Status
```bash
curl -X GET "https://api.twilio.com/2010-04-01/Accounts/YOUR_SID.json" \
  -u YOUR_SID:YOUR_AUTH_TOKEN
```

### Step 2: Test Media Sending Capability
```bash
curl -X POST "https://api.twilio.com/2010-04-01/Accounts/YOUR_SID/Messages.json" \
  -d "From=whatsapp:+YOUR_NUMBER" \
  -d "To=whatsapp:+RECIPIENT_NUMBER" \
  -d "MediaUrl=https://your-domain.com/test.pdf" \
  -d "Body=Test PDF" \
  -u YOUR_SID:YOUR_AUTH_TOKEN
```

### Step 3: Verify PDF URL Accessibility
```bash
curl -I https://your-domain.com/api/temp-pdf/your-pdf-id
```
Should return:
- Status: 200 OK
- Content-Type: application/pdf
- Content-Length: [size]

## 📱 Testing Workflow

### Phase 1: Sandbox Testing
1. Use Twilio WhatsApp Sandbox for initial testing
2. Test with pre-approved sandbox numbers
3. Verify PDF generation and download works

### Phase 2: Production Setup
1. Apply for WhatsApp Business API approval
2. Submit business verification documents
3. Request media sending permissions
4. Test with real phone numbers (after opt-in)

### Phase 3: Go Live
1. Replace sandbox credentials with production
2. Update webhook URLs
3. Test with actual customers
4. Monitor delivery reports

## 🛠️ Configuration Verification Tool

Use our built-in configuration checker:

```typescript
import { verifyTwilioConfiguration } from '@/lib/utils/twilioConfigChecker';

const results = await verifyTwilioConfiguration();
console.log('Configuration Status:', results);
```

## 📞 Twilio Support Resources

### Documentation
- [Twilio WhatsApp API Docs](https://www.twilio.com/docs/whatsapp)
- [Media Sending Guide](https://www.twilio.com/docs/whatsapp/send-media-messages)
- [Business Profile Setup](https://www.twilio.com/docs/whatsapp/business-profile)

### Error Codes Reference
- `21610`: WhatsApp number not verified
- `21614`: Invalid WhatsApp number format  
- `21617`: WhatsApp Business Account required
- `21619`: Media file too large or invalid
- `63016`: Media URL not accessible

### Getting Help
1. **Twilio Console**: Check message logs for detailed errors
2. **Twilio Support**: Submit ticket with error codes
3. **WhatsApp Business**: Verify business profile status
4. **Test Tool**: Use our configuration checker

## 🎯 Success Checklist

Before going live, ensure:
- ✅ Twilio account verified and active
- ✅ WhatsApp Business profile approved
- ✅ Media sending capability enabled
- ✅ PDF URLs publicly accessible via HTTPS
- ✅ Recipient opt-in consent obtained
- ✅ File sizes under 16MB limit
- ✅ Content-Type headers correct
- ✅ Error handling implemented
- ✅ Delivery status monitoring setup

## 🔧 Troubleshooting Commands

### Check Account Status
```bash
# Check account status
curl -u $TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN \
  https://api.twilio.com/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID.json

# List WhatsApp senders
curl -u $TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN \
  https://api.twilio.com/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID/Messages.json?From=whatsapp:+YOUR_NUMBER
```

### Test PDF URL
```bash
# Test PDF accessibility
curl -I https://your-domain.com/api/temp-pdf/test-id

# Download PDF to verify content
curl -o test.pdf https://your-domain.com/api/temp-pdf/test-id
```

Remember: **WhatsApp Business API approval can take 1-2 weeks**. Plan accordingly and test thoroughly in sandbox mode first!
