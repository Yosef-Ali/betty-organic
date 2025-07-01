'use server'

import { getWhatsAppSettings, sendWhatsAppMessage, type WhatsAppSettings } from './core'

// NEW: Send invoice to customer via WhatsApp
export async function sendCustomerInvoiceWhatsApp(invoiceData: {
    customerPhone: string;
    customerName: string;
    orderId: string;
    items: Array<{
        name: string;
        quantity: number | string;
        price: number;
    }>;
    subtotal: number;
    shippingFee?: number;
    discount?: number;
    totalAmount: number;
    paymentMethod?: string;
    transactionDate: string;
    storeName?: string;
    storeContact?: string;
    invoiceUrl?: string;
}) {
    try {
        const settings = await getWhatsAppSettings();

        if (!settings) {
            return {
                success: false,
                error: 'WhatsApp settings not found.',
            };
        }

        const storeName = invoiceData.storeName || 'Betty Organic';
        
        // Handle empty items case
        let itemsList = '';
        if (invoiceData.items && invoiceData.items.length > 0) {
            itemsList = invoiceData.items
                .map(item => `• ${item.name} (Qty: ${item.quantity}) - ETB ${item.price.toFixed(2)}`)
                .join('\n');
        } else {
            itemsList = '• Order details not available';
        }

        let message = `📄 *Invoice - ${storeName}*\n\n`;
        message += `Dear ${invoiceData.customerName},\n\n`;
        message += `Here is your invoice for order *#${invoiceData.orderId}*.\n\n`;
        message += `*Date:* ${invoiceData.transactionDate}\n\n`;
        message += `*Items:*\n${itemsList}\n\n`;
        message += `*Subtotal:* ETB ${invoiceData.subtotal.toFixed(2)}\n`;

        if (invoiceData.shippingFee && invoiceData.shippingFee > 0) {
            message += `*Shipping Fee:* ETB ${invoiceData.shippingFee.toFixed(2)}\n`;
        }
        if (invoiceData.discount && invoiceData.discount > 0) {
            message += `*Discount:* -ETB ${invoiceData.discount.toFixed(2)}\n`;
        }

        message += `*Total Amount:* ETB ${invoiceData.totalAmount.toFixed(2)}\n`;

        if (invoiceData.paymentMethod) {
            message += `*Payment Method:* ${invoiceData.paymentMethod}\n`;
        }

        if (invoiceData.invoiceUrl) {
            message += `\nView full invoice: ${invoiceData.invoiceUrl}\n`;
        }

        message += `\nThank you for your business with ${storeName}!`;
        if (invoiceData.storeContact) {
            message += `\nContact us: ${invoiceData.storeContact}`;
        }

        console.log('📱 Preparing customer invoice WhatsApp message:', {
            to: invoiceData.customerPhone,
            orderId: invoiceData.orderId,
            provider: settings.apiProvider,
            itemsCount: invoiceData.items.length,
            items: invoiceData.items
        });
        
        console.log('📄 Generated invoice message:');
        console.log(message);

        const sendResult = await sendWhatsAppMessage(
            invoiceData.customerPhone,
            message,
            settings
        );

        if (sendResult.success) {
            console.log('✅ Customer invoice sent successfully via', settings.apiProvider);
            return {
                success: true,
                message: sendResult.whatsappUrl 
                    ? 'Invoice WhatsApp URL generated for manual sending.'
                    : 'Invoice sent successfully via WhatsApp.',
                messageId: sendResult.messageId,
                provider: settings.apiProvider,
                whatsappUrl: sendResult.whatsappUrl,
            };
        } else {
            console.warn('⚠️ Failed to send customer invoice automatically:', sendResult.error);

            // Fallback: Generate WhatsApp URL for manual sending
            const customerPhone = invoiceData.customerPhone.replace('+', '');
            const whatsappUrl = `https://wa.me/${customerPhone}?text=${encodeURIComponent(message)}`;

            return {
                success: true,
                message: 'Invoice WhatsApp URL generated for manual sending.',
                whatsappUrl,
                provider: settings.apiProvider,
                error: sendResult.error
            };
        }
    } catch (error) {
        console.error('Error in sendCustomerInvoiceWhatsApp:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unknown error occurred while sending invoice.',
        };
    }
}

// NEW: Send invoice as IMAGE via WhatsApp (preferred method - simpler and more reliable)
export async function sendImageInvoiceWhatsApp(invoiceData: {
    customerPhone: string;
    customerName: string;
    orderId: string;
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

        const storeName = invoiceData.storeName || 'Betty Organic';
        const storeContact = invoiceData.storeContact || '+251944113998';

        console.log('📱 Preparing IMAGE invoice WhatsApp message:', {
            to: invoiceData.customerPhone,
            orderId: invoiceData.orderId,
            provider: settings.apiProvider,
            method: 'IMAGE'
        });

        // Generate receipt image via API route
        let imageUrl: string | undefined;
        let imageGenerated = false;
        
        try {
            console.log('🔄 Generating receipt image via API route...');
            console.log('📊 Receipt data being sent:', JSON.stringify({
                customerName: invoiceData.customerName,
                orderId: invoiceData.orderId,
                itemsCount: invoiceData.items.length,
                total: invoiceData.total
            }, null, 2));
            
            // Convert to receipt format
            const receiptData = {
                customerName: invoiceData.customerName,
                orderId: invoiceData.orderId,
                items: invoiceData.items.map(item => ({
                    name: item.name,
                    quantity: Number(item.quantity),
                    price: item.price
                })),
                total: invoiceData.total,
                orderDate: invoiceData.orderDate,
                orderTime: invoiceData.orderTime,
                storeName: invoiceData.storeName,
                storeContact: invoiceData.storeContact
            };

            // Get the base URL
            const baseUrl = process.env.NEXT_PUBLIC_NGROK_URL ||
                process.env.NEXTAUTH_URL ||
                process.env.NEXT_PUBLIC_SITE_URL ||
                'http://localhost:3000';

            console.log('🌐 Using base URL:', baseUrl);
            console.log('📝 Full receipt data:', receiptData);

            // Generate receipt image via API
            console.log('📤 Calling image generation API...');
            const imageResponse = await fetch(`${baseUrl}/api/generate-receipt-image`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(receiptData),
            });

            console.log('📥 Image generation response:', {
                status: imageResponse.status,
                ok: imageResponse.ok,
                statusText: imageResponse.statusText
            });

            if (imageResponse.ok) {
                const imageResult = await imageResponse.json();
                console.log('📄 Receipt generated successfully:', {
                    success: imageResult.success,
                    method: imageResult.method,
                    size: imageResult.size,
                    hasBase64: !!imageResult.imageBase64,
                    base64Length: imageResult.imageBase64?.length
                });

                if (!imageResult.success || !imageResult.imageBase64) {
                    console.error('❌ Image generation returned invalid data:', imageResult);
                    throw new Error('Invalid image generation result');
                }

                console.log('📤 Uploading to temp storage...');

                // Upload to temporary storage using the correct IMAGE API
                const uploadResponse = await fetch(`${baseUrl}/api/temp-image`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'ngrok-skip-browser-warning': 'true'
                    },
                    body: JSON.stringify({
                        imageData: imageResult.imageBase64,
                        filename: imageResult.filename,
                        expiresIn: 3600 // 1 hour
                    }),
                });

                console.log('📥 Upload response:', {
                    status: uploadResponse.status,
                    ok: uploadResponse.ok,
                    statusText: uploadResponse.statusText
                });

                if (uploadResponse.ok) {
                    const uploadResult = await uploadResponse.json();
                    imageUrl = uploadResult.url;
                    imageGenerated = true;
                    console.log('✅ Receipt uploaded to temporary URL:', imageUrl);
                    console.log('🎯 IMAGE GENERATION SUCCESS - Will send with media!');

                    // Verify the URL is publicly accessible
                    if (imageUrl && imageUrl.includes('localhost') && !imageUrl.includes('ngrok')) {
                        console.warn('⚠️ Receipt URL is localhost - Twilio cannot access it. Please use ngrok!');
                        console.warn('Run: ngrok http 3000');
                        console.warn('Then update NEXT_PUBLIC_NGROK_URL in .env.local');
                    }
                } else {
                    const uploadError = await uploadResponse.text();
                    console.error('❌ Failed to upload receipt to temporary URL:', {
                        status: uploadResponse.status,
                        error: uploadError
                    });
                }
            } else {
                const imageError = await imageResponse.text();
                console.error('❌ Failed to generate receipt image:', {
                    status: imageResponse.status,
                    error: imageError
                });
            }
        } catch (error) {
            console.error('💥 Error generating receipt:', error);
            console.log('📝 Falling back to text-only message');
        }

        // Generate minimal message for fallback scenarios only (server-side fallback)
        const fallbackMessage = `🧾 Invoice #${invoiceData.orderId} - ETB ${invoiceData.total.toFixed(2)} - Betty Organic`;

        // Send via WhatsApp with image attachment if available
        let sendResult: { success: boolean; error?: string; messageId?: string };
        
        console.log('📱 Preparing to send WhatsApp message:', {
            hasImageUrl: !!imageUrl,
            imageGenerated,
            imageUrl: imageUrl?.substring(0, 100) + '...',
            customerPhone: invoiceData.customerPhone,
            provider: settings.apiProvider
        });
        
        if (imageUrl && imageGenerated) {
            console.log('🚀 Sending IMAGE ONLY via WhatsApp (no text - server fallback)...');
            console.log('📎 Media URL:', imageUrl);
            sendResult = await sendWhatsAppMessage(
                invoiceData.customerPhone,
                "", // Empty message - send only image
                settings,
                imageUrl // Pass image URL as media
            );
            console.log('📬 WhatsApp send result (image only):', sendResult);
        } else {
            console.log('🚀 No image available, skipping WhatsApp send...');
            console.log('❓ Why no image?', {
                hasImageUrl: !!imageUrl,
                imageGenerated,
                imageUrl: imageUrl || 'undefined'
            });
            return {
                success: false,
                error: 'No image generated - cannot send empty message'
            };
        }

        if (sendResult.success) {
            console.log(`✅ IMAGE invoice sent successfully via WhatsApp`);
            return {
                success: true,
                message: `Invoice image sent successfully via WhatsApp!`,
                messageId: sendResult.messageId,
                provider: 'twilio',
                method: 'IMAGE',
                invoiceData,
                imageGenerated,
                imageUrl
            };
        } else {
            console.warn('⚠️ Automatic sending failed, generating WhatsApp URL:', sendResult.error);

            // Fallback: Generate WhatsApp URL for manual sending with minimal message
            const cleanPhone = invoiceData.customerPhone.replace(/[\s\-\(\)\+]/g, '');
            let finalFallbackMessage = fallbackMessage;
            
            if (imageUrl && imageGenerated) {
                finalFallbackMessage += `\n📄 View: ${imageUrl}`;
            }
            
            const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(finalFallbackMessage)}`;

            return {
                success: true,
                message: 'Invoice ready to send via WhatsApp URL',
                whatsappUrl,
                method: 'url',
                provider: 'twilio',
                invoiceData,
                imageGenerated,
                imageUrl,
                fallbackReason: sendResult.error
            };
        }
    } catch (error) {
        console.error('Error in sendImageInvoiceWhatsApp:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to send image invoice. Please try again.',
        };
    }
}

// NEW: Send customer receipt via WhatsApp (Sales Dashboard)
export async function sendSalesReceiptWhatsApp(receiptData: {
    customerPhone: string;
    customerName: string;
    orderId: string;
    items: Array<{
        name: string;
        grams: number;
        pricePerKg: number;
        totalPrice: number;
    }>;
    subtotal: number;
    deliveryCost: number;
    discount: number;
    total: number;
    orderDate: string;
    orderTime: string;
    paymentMethod?: string;
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

        // Generate professional receipt message with better formatting
        let message = `🧾 *SALES RECEIPT*\n`;
        message += `🌿 *${storeName}* 🌿\n`;
        message += `Fresh • Organic • Healthy\n`;
        message += `${'═'.repeat(40)}\n\n`;

        // Customer & Order Details
        message += `👤 *Customer:* ${receiptData.customerName}\n`;
        message += `📱 *Phone:* ${receiptData.customerPhone}\n`;
        message += `📋 *Receipt #:* ${receiptData.orderId}\n`;
        message += `📅 *Date:* ${receiptData.orderDate}\n`;
        message += `🕒 *Time:* ${receiptData.orderTime}\n`;
        message += `💳 *Payment:* ${receiptData.paymentMethod || 'Cash'}\n\n`;

        // Items Section
        message += `${'─'.repeat(40)}\n`;
        message += `📦 *ITEMS PURCHASED*\n`;
        message += `${'─'.repeat(40)}\n`;

        receiptData.items.forEach((item, index) => {
            const kg = (item.grams / 1000).toFixed(1);
            message += `${index + 1}. *${item.name}*\n`;
            message += `   📏 ${kg}kg @ ETB ${item.pricePerKg}/kg\n`;
            message += `   💰 ETB ${item.totalPrice.toFixed(2)}\n\n`;
        });

        // Payment Summary
        message += `${'─'.repeat(40)}\n`;
        message += `💵 *PAYMENT BREAKDOWN*\n`;
        message += `${'─'.repeat(40)}\n`;
        message += `Subtotal: ETB ${receiptData.subtotal.toFixed(2)}\n`;

        if (receiptData.deliveryCost > 0) {
            message += `Delivery: ETB ${receiptData.deliveryCost.toFixed(2)}\n`;
        }

        if (receiptData.discount > 0) {
            message += `Discount: -ETB ${receiptData.discount.toFixed(2)}\n`;
        }

        message += `${'═'.repeat(25)}\n`;
        message += `🎯 *TOTAL PAID: ETB ${receiptData.total.toFixed(2)}*\n`;
        message += `${'═'.repeat(25)}\n\n`;

        // Footer
        message += `✅ *Payment Received - Thank You!*\n\n`;
        message += `🚚 *Next Steps:*\n`;
        message += `• Your fresh produce is being prepared\n`;
        message += `• We'll contact you for delivery details\n`;
        message += `• Estimated delivery: Within 24 hours\n\n`;

        message += `💚 *Why Choose ${storeName}?*\n`;
        message += `🌱 100% Organic & Fresh\n`;
        message += `🌍 Supporting Local Farmers\n`;
        message += `💝 Promoting Healthy Living\n\n`;

        message += `📞 *Contact Us:*\n`;
        message += `WhatsApp: ${storeContact}\n`;
        message += `Instagram: @bettyorganic\n`;
        message += `Location: Genet Tower, Office #505\n\n`;

        message += `🙏 Thank you for choosing ${storeName}!\n`;
        message += `Your health is our priority! 💚`;

        console.log('📱 Preparing sales receipt WhatsApp message:', {
            to: receiptData.customerPhone,
            orderId: receiptData.orderId,
            provider: settings.apiProvider,
            messageLength: message.length
        });

        // Try to send via configured provider (Twilio preferred)
        const sendResult = await sendWhatsAppMessage(
            receiptData.customerPhone,
            message,
            settings
        );

        if (sendResult.success) {
            console.log('✅ Sales receipt sent successfully via', settings.apiProvider);
            return {
                success: true,
                message: `Receipt sent successfully via ${settings.apiProvider}!`,
                messageId: sendResult.messageId,
                provider: settings.apiProvider,
                receiptData
            };
        } else {
            console.warn('⚠️ Automatic sending failed, generating WhatsApp URL:', sendResult.error);

            // Fallback: Generate WhatsApp URL for manual sending
            const cleanPhone = receiptData.customerPhone.replace(/[\s\-\(\)\+]/g, '');
            const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;

            return {
                success: true,
                message: 'Receipt ready to send via WhatsApp URL',
                whatsappUrl,
                method: 'url',
                provider: settings.apiProvider,
                receiptData,
                fallbackReason: sendResult.error
            };
        }
    } catch (error) {
        console.error('Error in sendSalesReceiptWhatsApp:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to generate receipt. Please try again.',
        };
    }
}

// NEW: Send invoice as pre-generated IMAGE data via WhatsApp
export async function sendImageDataToWhatsApp(imageData: {
    customerPhone: string;
    customerName: string;
    orderId: string;
    total: number;
    orderDate: string;
    orderTime: string;
    storeName?: string;
    storeContact?: string;
    imageBase64: string; // Pre-generated base64 image data
}) {
    try {
        const settings = await getWhatsAppSettings();

        if (!settings) {
            return {
                success: false,
                error: 'WhatsApp settings not configured. Please check your WhatsApp settings.',
            };
        }

        const storeName = imageData.storeName || 'Betty Organic';
        const storeContact = imageData.storeContact || '+251944113998';

        console.log('📱 Preparing IMAGE invoice WhatsApp message:', {
            to: imageData.customerPhone,
            orderId: imageData.orderId,
            provider: settings.apiProvider,
            method: 'IMAGE',
            hasImageData: !!imageData.imageBase64
        });

        // Create temporary URL for the image using the dedicated image API
        let imageUrl: string | undefined;
        try {
            // Get the public URL (ngrok in development, or production URL)
            const baseUrl = process.env.NEXT_PUBLIC_NGROK_URL ||
                process.env.NEXTAUTH_URL ||
                process.env.NEXT_PUBLIC_SITE_URL ||
                'http://localhost:3000';

            console.log('🌐 Using base URL for image hosting:', baseUrl);
            console.log('📤 Uploading image data (size: ~' + Math.round(imageData.imageBase64.length / 1024) + ' KB)...');

            // Use the dedicated temp-image API for better reliability
            const payload = JSON.stringify({
                imageData: imageData.imageBase64,
                filename: `Betty_Organic_Invoice_${imageData.orderId}.png`,
                expiresIn: 3600 // 1 hour
            });

            const response = await fetch(`${baseUrl}/api/temp-image`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': 'true' // For ngrok compatibility
                },
                body: payload,
            });

            if (response.ok) {
                const result = await response.json();
                imageUrl = result.url;
                console.log('✅ Image uploaded to temporary URL:', imageUrl);

                // Verify the URL is publicly accessible
                if (imageUrl && imageUrl.includes('localhost') && !imageUrl.includes('ngrok')) {
                    console.warn('⚠️ Image URL is localhost - Twilio cannot access it. Please use ngrok!');
                    console.warn('Run: ngrok http 8080');
                    console.warn('Then update NEXT_PUBLIC_NGROK_URL in .env.local');
                }
            } else {
                const errorText = await response.text();
                console.error('❌ Image upload failed:', response.status, response.statusText, errorText);
                throw new Error(`Image upload failed: ${response.status} - ${errorText}`);
            }
        } catch (uploadError) {
            console.error('Error uploading image:', uploadError);
            throw new Error(`Failed to create image URL: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`);
        }

        // Create minimal message for fallback scenarios only
        const fallbackMessage = `🧾 Invoice #${imageData.orderId} - ETB ${imageData.total.toFixed(2)} - Betty Organic`;

        // Send image via Twilio WhatsApp WITHOUT text message (image only)
        let sendResult: { success: boolean; error?: string; messageId?: string };

        if (imageUrl) {
            console.log('🚀 Sending ONLY IMAGE via Twilio WhatsApp (no text)...');
            sendResult = await sendWhatsAppMessage(
                imageData.customerPhone,
                "", // Empty message - send only image
                settings,
                imageUrl // Pass image URL as media
            );

            // Check if the error is due to trial account media limitations
            if (!sendResult.success && sendResult.error) {
                const errorMessage = sendResult.error.toLowerCase();
                const isTrialLimitError = errorMessage.includes('trial') || 
                                        errorMessage.includes('media') || 
                                        errorMessage.includes('24') ||
                                        errorMessage.includes('quota') ||
                                        errorMessage.includes('limit');

                if (isTrialLimitError) {
                    console.warn('⚠️ Trial account media limit reached, sending minimal text message with receipt link...');
                    
                    // Create a minimal message with link to view the image
                    const enhancedMessage = `🧾 Invoice #${imageData.orderId} - ETB ${imageData.total.toFixed(2)}\n📄 View: ${imageUrl}`;

                    // Try sending the minimal text message
                    sendResult = await sendWhatsAppMessage(
                        imageData.customerPhone,
                        enhancedMessage,
                        settings
                    );

                    if (sendResult.success) {
                        console.log('✅ Minimal text message with receipt link sent successfully');
                        return {
                            success: true,
                            message: `Invoice link sent via WhatsApp (trial account media limit)`,
                            messageId: sendResult.messageId,
                            provider: 'twilio',
                            method: 'TEXT_WITH_LINK',
                            imageUrl,
                            trialLimitWorkaround: true
                        };
                    }
                }
            }
        } else {
            // Fallback to text message only if image upload failed
            console.warn('⚠️ Image upload failed, sending text message only');
            sendResult = await sendWhatsAppMessage(
                imageData.customerPhone,
                message,
                settings
            );
        }

        if (sendResult.success) {
            console.log('✅ Image invoice sent successfully via Twilio WhatsApp');
            return {
                success: true,
                message: `Invoice image sent successfully via WhatsApp!`,
                messageId: sendResult.messageId,
                provider: 'twilio',
                method: 'IMAGE',
                imageUrl
            };
        } else {
            console.warn('⚠️ Automatic image sending failed, generating WhatsApp URL:', sendResult.error);

            // Fallback: Generate WhatsApp URL for manual sending with minimal message
            const cleanPhone = imageData.customerPhone.replace(/[\s\-\(\)\+]/g, '');
            let finalFallbackMessage = fallbackMessage;

            if (imageUrl) {
                finalFallbackMessage += `\n📄 View: ${imageUrl}`;
            }

            const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(finalFallbackMessage)}`;

            return {
                success: true,
                message: 'Invoice image ready to send via WhatsApp URL',
                whatsappUrl,
                method: 'url',
                provider: 'twilio',
                imageUrl,
                fallbackReason: sendResult.error
            };
        }
    } catch (error) {
        console.error('Error in sendImageDataToWhatsApp:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to send image invoice. Please try again.',
        };
    }
}

// Legacy function for backward compatibility
export async function sendCustomerReceiptWhatsApp(receiptData: {
    customerPhone: string;
    customerName: string;
    orderId: string;
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
    // Convert legacy format to new format
    const convertedItems = receiptData.items.map(item => ({
        name: item.name,
        grams: Number(item.quantity) * 1000, // Convert kg to grams
        pricePerKg: item.price / Number(item.quantity), // Calculate price per kg
        totalPrice: item.price
    }));

    return await sendSalesReceiptWhatsApp({
        customerPhone: receiptData.customerPhone,
        customerName: receiptData.customerName,
        orderId: receiptData.orderId,
        items: convertedItems,
        subtotal: receiptData.total,
        deliveryCost: 0,
        discount: 0,
        total: receiptData.total,
        orderDate: receiptData.orderDate,
        orderTime: receiptData.orderTime,
        paymentMethod: 'Cash',
        storeName: receiptData.storeName,
        storeContact: receiptData.storeContact
    });
}
