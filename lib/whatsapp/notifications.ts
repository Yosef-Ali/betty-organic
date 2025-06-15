'use server'

import { getWhatsAppSettings, sendWhatsAppMessage, type WhatsAppSettings } from './core'

export async function sendAdminWhatsAppNotification(orderDetails: {
    id: string | number
    display_id: string
    items: Array<{
        name: string
        grams: number
        price: number
        unit_price: number
    }>
    total: number
    customer_name: string
    customer_phone: string
    delivery_address: string
    customer_email?: string | null
    user_id?: string | null
    created_at: string
}) {
    try {
        // Get admin settings
        const settings = await getWhatsAppSettings()

        if (!settings || !settings.enableOrderNotifications) {
            return {
                success: false,
                error: 'WhatsApp notifications are disabled'
            }
        }

        // Format order items
        const itemsList = orderDetails.items
            .map(item => `• ${item.name} (${item.grams}g) - ETB ${item.price.toFixed(2)}`)
            .join('\n')

        // Create formatted message using template
        const message = `🍎 *NEW ORDER - Betty Organic*

*Order ID:* ${orderDetails.display_id}
*Customer:* ${orderDetails.customer_name}
*Phone:* ${orderDetails.customer_phone}
*Delivery Address:* ${orderDetails.delivery_address}

*Items:*
${itemsList}

*Total Amount:* ETB ${orderDetails.total.toFixed(2)}

*Order Time:* ${new Date(orderDetails.created_at).toLocaleString()}

Please process this order as soon as possible! 🚚`

        console.log('📱 Preparing admin WhatsApp notification:', {
            to: settings.adminPhoneNumber,
            orderId: orderDetails.display_id,
            customer: orderDetails.customer_name,
            total: orderDetails.total,
            provider: settings.apiProvider
        })

        // Generate WhatsApp URL (this always works and is the primary method)
        const adminPhone = settings.adminPhoneNumber.replace('+', '')
        const whatsappUrl = `https://wa.me/${adminPhone}?text=${encodeURIComponent(message)}`

        console.log('📱 Admin WhatsApp notification URL generated')

        // Try to send automatically through Twilio if configured
        let automaticResult = null
        if (settings.apiKey) {
            try {
                const sendResult = await sendWhatsAppMessage(
                    settings.adminPhoneNumber,
                    message, // This is the plain text message
                    settings
                );

                if (sendResult.success) {
                    console.log('✅ Admin WhatsApp notification also sent automatically via', settings.apiProvider)
                    automaticResult = {
                        messageId: sendResult.messageId,
                        provider: settings.apiProvider
                    }
                } else {
                    console.warn('⚠️ Automatic WhatsApp sending failed, but URL method is primary:', sendResult.error)
                }
            } catch (error) {
                console.warn('⚠️ Automatic API attempt failed, but URL method is primary:', error)
            }
        }

        // Always return success with WhatsApp URL (primary method)
        return {
            success: true,
            message: automaticResult
                ? `Admin notification URL generated and also sent via ${automaticResult.provider}`
                : 'Admin notification URL generated for opening',
            whatsappUrl,
            method: 'url', // Primary method is always URL
            provider: settings.apiProvider || 'manual',
            automatic: automaticResult, // Additional info if API also worked
            data: {
                adminPhone: settings.adminPhoneNumber,
                message,
                orderId: orderDetails.display_id
            }
        }
    } catch (error) {
        console.error('Failed to send admin WhatsApp notification:', error)
        return {
            success: false,
            error: 'Failed to send admin notification'
        }
    }
}

// Enhanced: Send PDF document directly via Twilio WhatsApp (following official Twilio docs)
// Per Twilio docs: WhatsApp does not support Body text with document attachments
async function sendTwilioDocument({
    phoneNumber,
    documentUrl,
    settings,
}: {
    phoneNumber: string;
    documentUrl: string;
    settings: WhatsAppSettings;
}): Promise<{ success: boolean; error?: string; messageId?: string }> {
    try {
        if (!settings.apiKey || !settings.apiSecret) {
            throw new Error('Twilio API credentials not configured');
        }

        const twilioAccountSid = settings.apiKey;
        const twilioAuthToken = settings.apiSecret;
        const twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER;

        if (!twilioWhatsAppNumber) {
            throw new Error('TWILIO_WHATSAPP_NUMBER is not configured');
        }

        // Import formatPhoneNumber
        const { formatPhoneNumber } = await import('./core');

        // Validate the document URL is accessible before sending (following Twilio best practices)
        console.log('🔍 Validating PDF URL accessibility:', documentUrl);
        try {
            const urlTest = await fetch(documentUrl, { method: 'HEAD' });
            if (!urlTest.ok) {
                throw new Error(`PDF URL returned ${urlTest.status}: ${urlTest.statusText}`);
            }

            const contentLength = urlTest.headers.get('content-length');
            if (contentLength) {
                const fileSizeMB = parseInt(contentLength) / (1024 * 1024);
                if (fileSizeMB > 5) {
                    throw new Error(`PDF file size (${fileSizeMB.toFixed(2)}MB) exceeds WhatsApp 5MB limit`);
                }
                console.log(`✅ PDF validated: ${fileSizeMB.toFixed(2)}MB`);
            }
        } catch (urlError) {
            console.error('❌ PDF URL validation failed:', urlError);
            throw new Error(`Cannot access PDF: ${urlError instanceof Error ? urlError.message : 'Unknown error'}`);
        }

        console.log('📄 Sending PDF document via Twilio WhatsApp API');

        // Following Twilio's official documentation - MediaUrl only, no Body text
        const formData = new URLSearchParams();
        formData.append('From', twilioWhatsAppNumber);
        formData.append('To', `whatsapp:${await formatPhoneNumber(phoneNumber)}`);
        formData.append('MediaUrl', documentUrl);
        // NOTE: Per Twilio docs, WhatsApp doesn't support Body text with document attachments

        const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${Buffer.from(`${twilioAccountSid}:${twilioAuthToken}`).toString('base64')}`
            },
            body: formData
        });

        const result = await response.json();

        console.log('📄 Twilio API response:', {
            status: response.status,
            success: response.ok,
            messageId: result.sid || null,
            error: result.message || null
        });

        if (response.ok && result.sid) {
            console.log('✅ PDF document sent successfully via Twilio WhatsApp:', result.sid);
            return {
                success: true,
                messageId: result.sid
            };
        } else {
            console.error('❌ Twilio API error response:', result);
            const errorMsg = result.message || result.detail || `HTTP ${response.status}`;
            throw new Error(`Twilio API failed: ${errorMsg}`);
        }
    } catch (error) {
        console.error('💥 Twilio document sending failed:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to send PDF document'
        };
    }
}

// Enhanced: Send actual PDF file via WhatsApp using Twilio
export async function sendPDFReceiptWhatsApp(receiptData: {
    customerPhone: string;
    customerName: string;
    orderId: string;
    pdfBase64: string; // Base64 encoded PDF
    items: Array<{
        name: string;
        quantity: number | string;
        price: number;
    }>;
    total: number;
    orderDate: string;
    orderTime: string;
    storeName?: string;
    storeContact?: string;
}) {
    try {
        const settings = await getWhatsAppSettings();

        if (!settings) {
            return {
                success: false,
                error: 'WhatsApp settings not configured. Please check your WhatsApp settings.',
            };
        }

        const storeName = receiptData.storeName || 'Betty Organic';
        const storeContact = receiptData.storeContact || '+251944113998';

        console.log('📱 Preparing PDF receipt WhatsApp message:', {
            to: receiptData.customerPhone,
            orderId: receiptData.orderId,
            provider: settings.apiProvider,
            hasPDF: !!receiptData.pdfBase64
        });

        // Create temporary URL for the PDF
        let pdfUrl: string | undefined;
        try {
            // Get the public URL (ngrok in development, or production URL)
            const baseUrl = process.env.NEXT_PUBLIC_NGROK_URL ||
                process.env.NEXTAUTH_URL ||
                process.env.NEXT_PUBLIC_SITE_URL ||
                'http://localhost:3000';

            console.log('🌐 Using base URL for PDF hosting:', baseUrl);

            const response = await fetch(`${baseUrl}/api/temp-pdf`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    pdfData: receiptData.pdfBase64,
                    filename: `Betty_Organic_Receipt_${receiptData.orderId}.pdf`,
                    expiresIn: 3600, // 1 hour
                }),
            });

            if (response.ok) {
                const result = await response.json();
                // Use the ngrok/public URL if available, otherwise fall back to the returned URL
                pdfUrl = result.url.replace('http://localhost:3000', baseUrl)
                    .replace('http://localhost:3001', baseUrl);
                console.log('✅ PDF uploaded to temporary URL:', pdfUrl);

                // Verify the URL is publicly accessible (not localhost)
                if (pdfUrl && pdfUrl.includes('localhost') && !pdfUrl.includes('ngrok')) {
                    console.warn('⚠️ PDF URL is localhost - Twilio cannot access it. Please use ngrok!');
                    console.warn('Run: ngrok http 3000');
                    console.warn('Then update NEXT_PUBLIC_NGROK_URL in .env.local');
                }
            } else {
                console.warn('⚠️ Failed to upload PDF to temporary URL');
            }
        } catch (uploadError) {
            console.error('Error uploading PDF:', uploadError);
        }

        // Generate message to accompany the PDF
        let message = `🧾 *PDF INVOICE - ${storeName}*\n\n`;
        message += `Dear ${receiptData.customerName},\n\n`;
        message += `Thank you for your order! Your detailed invoice is attached.\n\n`;
        message += `📋 *Order #:* ${receiptData.orderId}\n`;
        message += `📅 *Date:* ${receiptData.orderDate}\n`;
        message += `💰 *Total:* ETB ${receiptData.total.toFixed(2)}\n\n`;
        message += `🚚 *Next Steps:*\n`;
        message += `• Your fresh produce is being prepared\n`;
        message += `• We'll contact you for delivery details\n`;
        message += `• Estimated delivery: Within 24 hours\n\n`;
        message += `📞 *Questions?* Reply to this message\n`;
        message += `📱 WhatsApp: ${storeContact}\n\n`;
        message += `💚 Thank you for choosing ${storeName}!`;

        // Enhanced PDF document sending with better error handling
        let sendResult: { success: boolean; error?: string; messageId?: string };

        if (pdfUrl && settings.apiProvider === 'twilio') {
            console.log('🚀 Attempting to send PDF as WhatsApp document attachment...');

            // First, verify the PDF URL is accessible
            try {
                const pdfTest = await fetch(pdfUrl, { method: 'HEAD' });
                if (!pdfTest.ok) {
                    throw new Error(`PDF URL not accessible: ${pdfTest.status}`);
                }
                console.log('✅ PDF URL verified as accessible');
            } catch (urlError) {
                console.error('❌ PDF URL verification failed:', urlError);
                throw new Error(`PDF hosting failed: ${urlError instanceof Error ? urlError.message : 'Unknown error'}`);
            }

            console.log('📤 Sending PDF document via Twilio...');
            sendResult = await sendTwilioDocument({
                phoneNumber: receiptData.customerPhone,
                documentUrl: pdfUrl,
                settings
            });

            console.log('📄 Document send result:', sendResult);

            // If document sending succeeds, send a separate follow-up message with details
            if (sendResult.success) {
                console.log('✅ PDF document sent successfully! Sending follow-up message...');

                // Send follow-up message with order details
                const followUpMessage = `🧾 *Invoice Details*\n\n${message}`;

                try {
                    await sendWhatsAppMessage(
                        receiptData.customerPhone,
                        followUpMessage,
                        settings
                    );
                    console.log('✅ Follow-up message sent successfully');
                } catch (followUpError) {
                    console.warn('⚠️ Follow-up message failed, but PDF was sent:', followUpError);
                }
            } else {
                console.warn('⚠️ Document sending failed, sending text message with link instead');
                const messageWithPDF = message + `\n\n📄 *Download your PDF invoice:*\n${pdfUrl}\n\n_Click the link above to download your detailed invoice_`;
                sendResult = await sendWhatsAppMessage(
                    receiptData.customerPhone,
                    messageWithPDF,
                    settings
                );
            }
        } else {
            // For non-Twilio providers or if no PDF URL, send regular message
            const messageWithPDF = pdfUrl
                ? message + `\n\n📄 *Download your PDF invoice:*\n${pdfUrl}\n\n_Click the link above to download your detailed invoice_`
                : message;

            sendResult = await sendWhatsAppMessage(
                receiptData.customerPhone,
                messageWithPDF,
                settings
            );
        }

        if (sendResult.success) {
            console.log('✅ PDF invoice sent successfully via', settings.apiProvider);
            return {
                success: true,
                message: `PDF invoice sent successfully via ${settings.apiProvider}!`,
                messageId: sendResult.messageId,
                provider: settings.apiProvider,
                receiptData,
                pdfGenerated: true,
                pdfUrl
            };
        } else {
            console.warn('⚠️ Automatic PDF sending failed, generating WhatsApp URL:', sendResult.error);

            // Fallback: Generate WhatsApp URL for manual sending
            const cleanPhone = receiptData.customerPhone.replace(/[\s\-\(\)\+]/g, '');
            let fallbackMessage = message;

            if (pdfUrl) {
                fallbackMessage += `\n\n📄 *PDF Invoice:* ${pdfUrl}`;
            }

            const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(fallbackMessage)}`;

            return {
                success: true,
                message: 'PDF invoice ready to send via WhatsApp URL',
                whatsappUrl,
                method: 'url',
                provider: settings.apiProvider,
                receiptData,
                pdfGenerated: true,
                pdfUrl,
                fallbackReason: sendResult.error
            };
        }
    } catch (error) {
        console.error('Error in sendPDFReceiptWhatsApp:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to send PDF invoice. Please try again.',
        };
    }
}
