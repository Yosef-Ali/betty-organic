import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Barcode from "react-barcode";
import { Printer, MessageCircle, Download, X } from "lucide-react";
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
      // Generate the image first
      const html2canvas = (await import('html2canvas')).default;
      const element = document.querySelector('#receipt-content') as HTMLElement;
      
      if (!element) {
        throw new Error('Content not found');
      }

      // Temporarily force white background and dark text for capture
      const originalStyles = {
        backgroundColor: element.style.backgroundColor,
        color: element.style.color,
      };
      
      element.style.backgroundColor = '#ffffff';
      element.style.color = '#000000';
      
      // Also force all child elements to have dark text on white background
      const allElements = element.querySelectorAll('*');
      const originalChildStyles: { element: HTMLElement; color: string; backgroundColor: string }[] = [];
      
      allElements.forEach((child) => {
        const htmlChild = child as HTMLElement;
        originalChildStyles.push({
          element: htmlChild,
          color: htmlChild.style.color,
          backgroundColor: htmlChild.style.backgroundColor,
        });
        htmlChild.style.color = '#000000';
        if (htmlChild.style.backgroundColor) {
          htmlChild.style.backgroundColor = '#ffffff';
        }
      });

      const canvas = await html2canvas(element, {
        backgroundColor: '#ffffff',
        scale: 3,
        useCORS: true,
        allowTaint: false
      });

      // Restore original styles
      element.style.backgroundColor = originalStyles.backgroundColor;
      element.style.color = originalStyles.color;
      
      originalChildStyles.forEach(({ element, color, backgroundColor }) => {
        element.style.color = color;
        element.style.backgroundColor = backgroundColor;
      });

      // Convert to blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), 'image/png', 1.0);
      });

      const file = new File([blob], `betty-organic-receipt-${orderId || Date.now()}.png`, {
        type: 'image/png'
      });

      // Simple share text for receipt
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const shareText = isLocalhost 
        ? `🛍️ My Betty Organics receipt for Order #${orderId || Date.now()}\n\n💰 Total: ${total.toFixed(2)} ETB\n📧 Visit Betty Organics for more!`
        : `🛍️ My Betty Organics receipt for Order #${orderId || Date.now()}\n\n📥 View receipt: ${window.location.origin}/public/receipt/${orderId || Date.now()}`;

      // Always try native device sharing first - works with ALL apps user has
      if (navigator.share) {
        // Try with image first
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: 'Betty Organic Receipt',
            text: shareText,
            files: [file]
          });
        } else {
          // Fallback to text-only native sharing
          await navigator.share({
            title: 'Betty Organic Receipt',
            text: shareText
          });
        }
      } else {
        // If no native sharing, just download the image
        const link = document.createElement('a');
        link.download = `betty-organic-receipt-${orderId || Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        
        alert('Receipt image downloaded! You can now share it using any app you prefer.');
      }

      console.log(`✅ Receipt image shared successfully!`);
    } catch (error) {
      console.error('Error sharing receipt image:', error);
      alert('Sharing not available. Please use the Download button instead.');
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

  const handleDownloadImage = async () => {
    setIsSending(true);
    try {
      // Generate the image
      const html2canvas = (await import('html2canvas')).default;
      const element = document.querySelector('#receipt-content') as HTMLElement;
      
      if (!element) {
        throw new Error('Content not found');
      }

      // Temporarily force white background and dark text for capture
      const originalStyles = {
        backgroundColor: element.style.backgroundColor,
        color: element.style.color,
      };
      
      element.style.backgroundColor = '#ffffff';
      element.style.color = '#000000';
      
      // Also force all child elements to have dark text on white background
      const allElements = element.querySelectorAll('*');
      const originalChildStyles: { element: HTMLElement; color: string; backgroundColor: string }[] = [];
      
      allElements.forEach((child) => {
        const htmlChild = child as HTMLElement;
        originalChildStyles.push({
          element: htmlChild,
          color: htmlChild.style.color,
          backgroundColor: htmlChild.style.backgroundColor,
        });
        htmlChild.style.color = '#000000';
        if (htmlChild.style.backgroundColor) {
          htmlChild.style.backgroundColor = '#ffffff';
        }
      });

      const canvas = await html2canvas(element, {
        backgroundColor: '#ffffff',
        scale: 3,
        useCORS: true,
        allowTaint: false
      });

      // Restore original styles
      element.style.backgroundColor = originalStyles.backgroundColor;
      element.style.color = originalStyles.color;
      
      originalChildStyles.forEach(({ element, color, backgroundColor }) => {
        element.style.color = color;
        element.style.backgroundColor = backgroundColor;
      });

      // Download the image
      const link = document.createElement('a');
      link.download = `betty-organic-receipt-${orderId || Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      console.log('✅ Receipt image downloaded successfully!');
    } catch (error) {
      console.error('Error downloading receipt image:', error);
      alert('Error downloading image. Please try again.');
    } finally {
      setIsSending(false);
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
          <div id="receipt-content" className="print-content border border-border p-4 rounded bg-card text-card-foreground print:bg-white print:text-black">
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold text-foreground">Betty Organic</h2>
              <p className="text-sm text-muted-foreground">
                Fresh Organic Fruits & Vegetables
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Thank you for your order!
              </p>
            </div>

            {customerInfo && (
              <div className="mb-4 text-center border-b border-border pb-2">
                <p className="text-sm font-medium text-foreground">Customer: {customerInfo}</p>
                {orderId && <p className="text-sm text-muted-foreground">Order ID: {orderId}</p>}
              </div>
            )}

            <div className="mb-4">
              <h3 className="font-semibold mb-3 text-foreground">Order Items:</h3>
              <ul className="space-y-2">
                {items.map((item, index) => (
                  <li key={index} className={`flex justify-between text-sm pb-2 text-foreground ${index < items.length - 1 ? 'border-b border-gray-400' : ''}`}>
                    <span>
                      {item.name} ({(item.quantity * 1000).toFixed(0)}g)
                    </span>
                    <span className="font-medium text-foreground">ETB {item.price.toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex justify-between font-bold text-lg mb-4 border-t-2 border-gray-600 pt-3 text-foreground">
              <span>Total Amount:</span>
              <span>ETB {total.toFixed(2)}</span>
            </div>

            <div className="flex justify-center mb-4">
              <Barcode value={orderId || `ORDER-${Date.now()}`} width={1.5} height={50} />
            </div>

            <div className="text-center text-xs text-muted-foreground border-t border-gray-400 pt-3">
              <p className="font-medium">Order Details</p>
              <p>Date: {new Date().toLocaleDateString()}</p>
              <p>Time: {new Date().toLocaleTimeString()}</p>
              <p className="mt-2 text-green-600">🌿 Fresh • Organic • Healthy 🌿</p>
            </div>
          </div>

          {/* Non-printable controls */}
          <div className="flex justify-center gap-2 mt-4 no-print">
            <Button 
              onClick={handlePrint} 
              variant="outline" 
              className="gap-2"
            >
              <Printer className="h-4 w-4" />
              Print
            </Button>
            <Button
              onClick={handleSendToCustomer}
              disabled={isSending}
              className="gap-2 bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 disabled:opacity-50"
            >
              <MessageCircle className="h-4 w-4" />
              {isSending ? 'Sending...' : 'Send'}
            </Button>
            <Button 
              onClick={handleDownloadImage}
              disabled={isSending}
              variant="outline"
              size="sm"
              className="h-10 w-10 p-0"
              title="Download as Image"
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button 
              onClick={onClose} 
              variant="outline"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default OrderReceiptModal;