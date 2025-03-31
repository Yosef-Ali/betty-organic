# WhatsApp Integration Guide

## Setup Requirements

1. Meta Business Account
2. WhatsApp Business API Account
3. WhatsApp Business Phone Number
4. Meta Developer Account

## Configuration Steps

1. Create a Meta Business Account:
   - Go to [Meta Business Suite](https://business.facebook.com/)
   - Create a new account or use an existing one

2. Set up WhatsApp Business API:
   - Visit [Meta Developer Portal](https://developers.facebook.com/)
   - Create a new app or use an existing one
   - Add WhatsApp integration to your app
   - Complete the verification process

3. Get Required Credentials:
   - Phone Number ID: Found in WhatsApp > Getting Started
   - API Token: Generate in App Dashboard > Settings > Basic
   - Admin WhatsApp Number: Your business WhatsApp number

4. Update Environment Variables:
   ```env
   WHATSAPP_API_TOKEN=your_api_token_here
   WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id_here
   ADMIN_WHATSAPP_NUMBER=your_whatsapp_number
   ```

5. Test the Integration:
   - Send a test message using the provided notification system
   - Check WhatsApp Business Manager for incoming messages
   - Verify message formatting and delivery

## Message Templates

To use message templates:

1. Create templates in WhatsApp Business Manager:
   - Go to Business Settings > WhatsApp > Message Templates
   - Create a new template following Meta's guidelines
   - Wait for template approval

2. Use the `sendWhatsAppTemplate` function:
   ```typescript
   await sendWhatsAppTemplate(
     phoneNumber,
     "template_name",
     "en", // language code
     [
       {
         type: "body",
         parameters: [
           { type: "text", text: "parameter1" }
         ]
       }
     ]
   );
   ```

## Troubleshooting

1. Message Not Sending:
   - Verify API credentials are correct
   - Check phone number format (include country code)
   - Ensure WhatsApp Business API is active

2. Template Messages Failed:
   - Verify template is approved
   - Check parameter count matches template
   - Ensure language code is supported

3. Rate Limits:
   - Business accounts have higher limits
   - Monitor usage in Meta Business Manager
   - Implement retry logic for failed messages

## Security Considerations

1. Environment Variables:
   - Never commit API credentials to version control
   - Use different credentials for development/production
   - Rotate API tokens periodically

2. Phone Number Validation:
   - Always validate and format phone numbers
   - Use international format with country code
   - Implement rate limiting for notifications

3. Error Handling:
   - Log errors for debugging
   - Implement fallback notification methods
   - Monitor failed deliveries

## Best Practices

1. Message Content:
   - Keep messages concise and clear
   - Use appropriate formatting (bold, lists)
   - Include order reference numbers

2. Timing:
   - Respect local time zones
   - Avoid sending late night messages
   - Batch notifications when possible

3. Testing:
   - Test with various message lengths
   - Verify unicode character support
   - Check message rendering on different devices
