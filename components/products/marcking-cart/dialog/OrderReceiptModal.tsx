import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Barcode from "react-barcode";
import { Printer, MessageCircle, Download } from "lucide-react";
import { sendImageInvoiceWhatsApp } from "@/app/actions/whatsappActions";
import { generateReceiptPDF, generateReceiptFromHTML, downloadPDF, type ReceiptData } from "@/lib/utils/pdfGenerator";

interface OrderReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: { name: string; quantity: number; price: number }[];
  total: number;
  customerInfo?: string;
  orderId?: string;
  customerPhone?: string;
  customerName?: string;
}

export const OrderReceiptModal: React.FC<OrderReceiptModalProps> = ({
  isOpen,
  onClose,
  items,
  total,
  customerInfo,
  orderId,
  customerPhone,
  customerName,
}) => {
  console.log('[RECEIPT] Modal render - isOpen:', isOpen, 'items:', items?.length, 'total:', total);
  console.log('[RECEIPT] Customer data - phone:', customerPhone, 'name:', customerName, 'info:', customerInfo);
  const handlePrint = () => {
    window.print();
  };

  const generateCustomerReceiptText = () => {
    const storeName = "Betty Organic";
    const currentDate = new Date();
    const orderDate = currentDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const orderTime = currentDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });

    let text = `🧾 *${storeName} - Order Receipt*\n`;
    text += `🌿 Fresh Organic Fruits & Vegetables 🌿\n`;
    text += `${'═'.repeat(35)}\n\n`;

    text += `👤 *Customer:* ${customerName || 'Valued Customer'}\n`;
    text += `📋 *Order ID:* ${orderId}\n`;
    text += `📅 *Date:* ${orderDate}\n`;
    text += `� *Time:* ${orderTime}\n\n`;

    text += `${'─'.repeat(35)}\n`;
    text += `� *ORDER ITEMS*\n`;
    text += `${'─'.repeat(35)}\n`;

    let subtotal = 0;
    items.forEach((item, index) => {
      const itemTotal = item.price;
      subtotal += itemTotal;
      text += `${index + 1}. *${item.name}*\n`;
      text += `   📏 ${(item.quantity * 1000).toFixed(0)}g\n`;
      text += `   💰 ETB ${itemTotal.toFixed(2)}\n\n`;
    });

    text += `${'─'.repeat(35)}\n`;
    text += `� *PAYMENT SUMMARY*\n`;
    text += `${'─'.repeat(35)}\n`;
    text += `Subtotal: ETB ${subtotal.toFixed(2)}\n`;
    text += `Delivery: ETB 0.00\n`;
    text += `Discount: ETB 0.00\n`;
    text += `${'─'.repeat(20)}\n`;
    text += `*TOTAL: ETB ${total.toFixed(2)}*\n\n`;

    text += `${'═'.repeat(35)}\n`;
    text += `✅ *Order Confirmed!*\n\n`;
    text += `🚚 We'll prepare your fresh organic produce\n`;
    text += `📞 We'll contact you for delivery coordination\n\n`;
    text += `💚 Thank you for choosing Betty Organic!\n`;
    text += `🌱 Supporting healthy living & sustainable farming\n\n`;
    text += `📱 Questions? Reply to this message\n`;
    text += `🌐 Visit: ${typeof window !== 'undefined' ? window.location.origin : 'bettyorganic.com'}`;

    return encodeURIComponent(text);
  };


  const [isSending, setIsSending] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const handleSendToCustomer = async () => {
    setIsSending(true);

    try {
      let phoneToUse = customerPhone;

      // If no customer phone, show a more user-friendly message and don't send
      if (!phoneToUse || phoneToUse.trim() === '') {
        console.warn('❌ No customer phone number found - cannot send receipt automatically');
        setIsSending(false);
        return;
      }

      // Validate Ethiopian phone number format with better error handling
      try {
        const cleanPhone = phoneToUse.replace(/[\s\-\(\)]/g, '');
        const phoneRegex = /^\+?251\d{9}$/;

        if (!phoneRegex.test(cleanPhone)) {
          console.error(`❌ Invalid phone number format: ${phoneToUse} - Expected Ethiopian format (+251XXXXXXXXX)`);
          setIsSending(false);
          return;
        }

        phoneToUse = cleanPhone.startsWith('+') ? cleanPhone : `+${cleanPhone}`;
      } catch (phoneError) {
        console.error('❌ Phone number validation error:', phoneError);
        setIsSending(false);
        return;
      }

      // Prepare receipt data for image-based WhatsApp sending
      const currentDate = new Date();
      const invoiceData = {
        customerPhone: phoneToUse,
        customerName: customerName || 'Valued Customer',
        orderId: orderId || `BO-SALES-${Date.now().toString().slice(-6)}`,
        items: items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        total: total,
        orderDate: currentDate.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        orderTime: currentDate.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit'
        }),
        storeName: 'Betty Organic',
        storeContact: '+251944113998'
      };

      console.log('Sending receipt image via WhatsApp:', invoiceData);

      // Use CLIENT-SIDE image generation (like the working test page)
      try {
        console.log('🖼️ Generating receipt image CLIENT-SIDE in modal...');
        
        // Import the client-side image generator
        const { generateReceiptImage } = await import('@/lib/utils/pdfGenerator');
        
        // Generate image blob client-side
        const imageBlob = await generateReceiptImage(invoiceData);
        
        // Convert to base64
        const imageBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64String = (reader.result as string).split(',')[1];
            resolve(base64String);
          };
          reader.onerror = reject;
          reader.readAsDataURL(imageBlob);
        });

        console.log('✅ Client-side image generated in modal:', {
          size: imageBlob.size,
          base64Length: imageBase64.length
        });

        // Send the pre-generated image data to server
        const { sendImageDataToWhatsApp } = await import('@/lib/whatsapp/invoices');
        
        const result = await sendImageDataToWhatsApp({
          customerPhone: phoneToUse,
          customerName: invoiceData.customerName,
          orderId: invoiceData.orderId,
          total: invoiceData.total,
          orderDate: invoiceData.orderDate,
          orderTime: invoiceData.orderTime,
          storeName: 'Betty Organic',
          storeContact: '+251944113998',
          imageBase64
        });

        if (result.success) {
          console.log(`✅ Receipt image sent successfully to ${phoneToUse} via WhatsApp!`);

          // If there's a WhatsApp URL fallback, open it
          if (result.whatsappUrl) {
            window.open(result.whatsappUrl, "_blank");
          }
        } else {
          console.error(`❌ Failed to send receipt: ${result.error || 'Unknown error'}`);
        }
      } catch (error) {
        console.error('Client-side image generation failed in modal:', error);
        
        // Fallback to server-side generation
        try {
          const result = await sendImageInvoiceWhatsApp(invoiceData);

          if (result.success) {
            console.log(`✅ Receipt sent successfully to ${phoneToUse} via WhatsApp (fallback)!`);

            // If there's a WhatsApp URL fallback, open it
            if (result.whatsappUrl) {
              window.open(result.whatsappUrl, "_blank");
            }
          } else {
            console.error(`❌ Failed to send receipt (fallback): ${result.error || 'Unknown error'}`);
          }
        } catch (fallbackError) {
          console.error('Both client-side and server-side image generation failed:', fallbackError);
        }
      }
    } catch (outerError) {
      console.error('Error in WhatsApp sending process:', outerError);
    } finally {
      setIsSending(false);
    }
  };

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      const currentDate = new Date();
      const receiptData: ReceiptData = {
        customerName: customerName || 'Valued Customer',
        customerEmail: customerInfo?.includes('@') ? customerInfo.split('(')[1]?.split(')')[0] : undefined,
        orderId: orderId || `BO-SALES-${Date.now().toString().slice(-6)}`,
        items: items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        total: total,
        orderDate: currentDate.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        orderTime: currentDate.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit'
        }),
        storeName: 'Betty Organic',
        storeContact: '+251944113998'
      };

      const pdfBlob = await generateReceiptPDF(receiptData);
      const filename = `Betty_Organic_Receipt_${receiptData.orderId}.pdf`;
      downloadPDF(pdfBlob, filename);

      console.log('✅ PDF receipt downloaded successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleDownloadHTMLPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      const pdfBlob = await generateReceiptFromHTML('receipt-content');
      const filename = `Betty_Organic_Receipt_${orderId || Date.now()}.pdf`;
      downloadPDF(pdfBlob, filename);

      console.log('✅ HTML-to-PDF receipt downloaded successfully');
    } catch (error) {
      console.error('Error generating HTML-to-PDF:', error);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <>
      {/* Print-only styles */}
      <style>
        {`
          @media print {
            body * {
              visibility: hidden;
            }
            .print-content, .print-content * {
              visibility: visible;
            }
            .print-content {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
            .no-print {
              display: none !important;
            }
          }
        `}
      </style>

      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[425px] z-[60] bg-background border-border">
          <DialogHeader className="no-print">
            <DialogTitle className="text-foreground">Order Receipt</DialogTitle>
          </DialogHeader>

          {/* Printable content */}
          <div id="receipt-content" className="print-content border border-border p-4 rounded bg-background dark:bg-white dark:text-black">
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold text-foreground dark:text-black">Betty Organic</h2>
              <p className="text-sm text-muted-foreground dark:text-gray-600">
                Fresh Organic Fruits & Vegetables
              </p>
              <p className="text-xs text-muted-foreground dark:text-gray-500 mt-1">
                Thank you for your order!
              </p>
            </div>

            {customerInfo && (
              <div className="mb-4 text-center border-b pb-2">
                <p className="text-sm font-medium text-foreground dark:text-black">Customer: {customerInfo}</p>
                {orderId && <p className="text-sm text-muted-foreground dark:text-gray-700">Order ID: {orderId}</p>}
              </div>
            )}

            <div className="mb-4">
              <h3 className="font-semibold mb-2 text-foreground dark:text-black">Order Items:</h3>
              <ul className="space-y-1">
                {items.map((item, index) => (
                  <li key={index} className="flex justify-between text-sm border-b border-border dark:border-gray-300 pb-1 text-foreground dark:text-black">
                    <span>
                      {item.name} ({(item.quantity * 1000).toFixed(0)}g)
                    </span>
                    <span className="font-medium text-foreground dark:text-black">ETB {item.price.toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex justify-between font-bold text-lg mb-4 border-t border-border dark:border-gray-300 pt-2 text-foreground dark:text-black">
              <span>Total Amount:</span>
              <span>ETB {total.toFixed(2)}</span>
            </div>

            <div className="flex justify-center mb-4">
              <Barcode value={orderId || `ORDER-${Date.now()}`} width={1.5} height={50} />
            </div>

            <div className="text-center text-xs text-muted-foreground dark:text-gray-600 border-t border-border dark:border-gray-300 pt-2">
              <p className="font-medium">Order Details</p>
              <p>Date: {new Date().toLocaleDateString()}</p>
              <p>Time: {new Date().toLocaleTimeString()}</p>
              <p className="mt-2 text-green-600 dark:text-green-700">🌿 Fresh • Organic • Healthy 🌿</p>
            </div>
          </div>

          {/* Non-printable controls */}
          <div className="flex flex-col gap-3 mt-4 no-print">
            {/* Simplified action buttons */}
            <div className="flex justify-center gap-2">
              <Button onClick={handlePrint} variant="outline" className="gap-2 flex-1">
                <Printer className="h-4 w-4" />
                Print
              </Button>
              <Button
                onClick={handleSendToCustomer}
                disabled={isSending || !customerPhone}
                className="gap-2 bg-green-600 hover:bg-green-700 flex-1 disabled:opacity-50"
              >
                <MessageCircle className="h-4 w-4" />
                {isSending ? 'Sending Image Invoice...' : 'Send Image Invoice'}
              </Button>
            </div>

            {customerPhone ? (
              <p className="text-xs text-center text-green-600">
                ✅ Receipt image will be sent to: {customerPhone} via WhatsApp
              </p>
            ) : (
              <div className="text-xs text-center space-y-1">
                <p className="text-amber-600">
                  ⚠️ No customer phone number found
                </p>
                <p className="text-gray-600">
                  To send receipts automatically, select a customer with a phone number in the sales cart
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default OrderReceiptModal;