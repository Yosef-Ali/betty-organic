# WhatsApp Integration Guide

This guide explains how to set up and use the automatic WhatsApp notification system for Betty Organic App.

## Overview

The WhatsApp integration automatically sends order notifications to the admin when customers place orders from the marketing page. The system supports multiple API providers for sending messages automatically without requiring manual intervention.

## Supported API Providers

### 1. Manual Mode (Default)
- **How it works**: Generates WhatsApp URLs that open in a new tab with pre-filled messages
- **Setup**: No additional configuration required
- **Use case**: Testing, simple setups, or when automatic APIs are not available
- **Limitation**: Requires user to manually click "Send" in WhatsApp

### 2. Twilio WhatsApp API (Recommended)
- **How it works**: Sends messages automatically through Twilio's WhatsApp Business API
- **Setup**: Requires Twilio account and WhatsApp Business approval
- **Use case**: Production environments requiring full automation
- **Benefits**: Completely automatic, reliable delivery, message status tracking

### 3. WhatsApp Web.js
- **How it works**: Uses a local service running WhatsApp Web automation
- **Setup**: Requires running a separate WhatsApp Web.js service
- **Use case**: Self-hosted solutions, cost-effective automation
- **Requirements**: Dedicated server/machine to run WhatsApp Web session

### 4. Baileys
- **How it works**: Uses a local service running Baileys WhatsApp automation
- **Setup**: Requires running a separate Baileys service
- **Use case**: Advanced users, custom implementations
- **Requirements**: Dedicated server/machine to run WhatsApp session

## Configuration

### Dashboard Settings

1. Go to **Dashboard → Settings → WhatsApp**
2. Configure the following:
   - **Admin WhatsApp Number**: Enter the admin's WhatsApp number with country code (e.g., +251912345678)
   - **API Provider**: Choose from Manual, Twilio, WhatsApp Web.js, or Baileys
   - **API Credentials**: Enter API keys/tokens based on the selected provider
   - **Notification Settings**: Enable/disable order notifications and real-time notifications

### Environment Variables

Add these environment variables to your `.env.local` file:

```env
# Admin WhatsApp number
ADMIN_WHATSAPP_NUMBER=+251912345678

# WhatsApp API Provider (manual|twilio|whatsapp-web-js|baileys)
WHATSAPP_API_PROVIDER=manual

# Twilio Configuration (if using Twilio)
WHATSAPP_API_KEY=your_twilio_account_sid
WHATSAPP_API_SECRET=your_twilio_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# WhatsApp Web.js Service URL (if using whatsapp-web-js)
WHATSAPP_WEBJS_SERVICE_URL=http://localhost:3001

# Baileys Service URL (if using baileys)
WHATSAPP_BAILEYS_SERVICE_URL=http://localhost:3002
```

## Setting Up Twilio WhatsApp API

### Prerequisites
1. Twilio account with WhatsApp Business API access
2. Approved WhatsApp Business profile
3. WhatsApp phone number from Twilio

### Steps
1. Create a [Twilio account](https://www.twilio.com/console)
2. Set up WhatsApp Business API in Twilio Console
3. Get your Account SID and Auth Token
4. Configure the WhatsApp Sandbox or production number
5. Add credentials to environment variables and dashboard settings

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

## Setting Up WhatsApp Web.js Service

### Create a separate service
1. Create a new Node.js project
2. Install whatsapp-web.js: `npm install whatsapp-web.js`
3. Create a simple Express server that accepts POST requests
4. Handle authentication and QR code scanning
5. Deploy the service and update the service URL

### Example service endpoint
```javascript
app.post('/send-message', async (req, res) => {
  const { to, message } = req.body;
  try {
    await client.sendMessage(`${to}@c.us`, message);
    res.json({ success: true, messageId: 'generated-id' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

## Setting Up Baileys Service

Similar to WhatsApp Web.js but using the Baileys library:
1. Create a Node.js service with Baileys
2. Handle authentication and session management
3. Create API endpoints for sending messages
4. Deploy and configure the service URL

## Testing the Integration

### From Dashboard Settings
1. Go to WhatsApp settings
2. Enter admin phone number and configure API provider
3. Click "Test WhatsApp" button
4. Check if the test message is received

### From Marketing Page
1. Add products to cart on the marketing page
2. Place an order as a customer
3. Check if admin receives automatic WhatsApp notification

## Message Flow

### Authenticated Users
1. Customer places order on marketing page
2. Order is saved to database
3. WhatsApp notification is sent automatically to admin
4. Customer sees success message
5. Admin receives formatted order details via WhatsApp

### Guest Users
1. Customer fills order form without account
2. Order details are prepared
3. Guest is prompted to share order via WhatsApp
4. Admin receives notification when customer sends message

## Troubleshooting

### Common Issues

1. **Messages not sending automatically**
   - Check API credentials in settings
   - Verify environment variables are set correctly
   - Ensure API provider service is running (for Web.js/Baileys)
   - Check console logs for error messages

2. **Test message fails**
   - Verify phone number format includes country code
   - Check API provider status
   - Ensure sufficient API credits (for Twilio)

3. **Fallback to manual mode**
   - System automatically falls back to URL generation if API fails
   - Users will see WhatsApp open with pre-filled message
   - Manual sending is required in this case

### Error Handling
- The system provides graceful fallbacks
- Failed automatic sends revert to manual URL generation
- Orders are always saved regardless of notification status
- Error messages are logged for debugging

## API Reference

### Server Actions

#### `sendAdminWhatsAppNotification(orderDetails)`
- Sends WhatsApp notification to admin
- Automatically chooses best available method
- Returns success status and method used

#### `testWhatsAppConnection()`
- Tests current WhatsApp configuration
- Sends test message to admin number
- Returns connection status and any errors

#### `getWhatsAppSettings()`
- Retrieves current WhatsApp configuration
- Returns settings including API provider and credentials

#### `updateWhatsAppSettings(settings)`
- Updates WhatsApp configuration
- Saves settings to database/storage

## Security Considerations

1. **API Credentials**: Store securely in environment variables
2. **Phone Numbers**: Validate format and sanitize input
3. **Message Content**: Escape special characters in order details
4. **Rate Limiting**: Implement rate limits for API calls
5. **Error Handling**: Don't expose sensitive information in error messages

## Cost Considerations

### Twilio WhatsApp API
- Charges per message sent
- Rates vary by country
- Consider message volume for cost estimation

### Self-hosted Solutions (Web.js/Baileys)
- Server hosting costs
- Maintenance overhead
- Reliability considerations

### Manual Mode
- No additional costs
- Requires manual intervention
- Good for testing and low-volume scenarios

## Future Enhancements

1. **Message Templates**: Support for rich message templates
2. **Media Messages**: Send images with order details
3. **Two-way Communication**: Handle customer replies
4. **Delivery Status**: Track message delivery and read status
5. **Multiple Admins**: Support notifications to multiple admin numbers
6. **Scheduled Messages**: Send follow-up messages for order updates

## Support

For issues with the WhatsApp integration:
1. Check console logs for error messages
2. Verify configuration in dashboard settings
3. Test with manual mode first
4. Check API provider documentation for specific issues