import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Barcode from "react-barcode";
import { Printer, Download, Share2 } from "lucide-react";
import { ExtendedOrder } from "@/types/order";

interface DownloadInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: ExtendedOrder | null;
}

export const DownloadInvoiceModal: React.FC<DownloadInvoiceModalProps> = ({
  isOpen,
  onClose,
  order,
}) => {
  if (!order) return null;

  // Convert ExtendedOrder to the format PrintPreviewModal expects
  const items = order.order_items.map(item => ({
    name: item.product_name,
    quantity: item.quantity,
    price: item.price * item.quantity
  }));
  
  const total = order.total_amount;
  const customerInfo = order.is_guest_order ? order.guest_name : order.customer?.name;
  const customerId = order.customer?.id;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    try {
      // Import html2canvas dynamically
      const html2canvas = (await import('html2canvas')).default;
      
      // Get the printable content element
      const element = document.querySelector('.download-content') as HTMLElement;
      if (!element) return;

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

      // Create canvas from the element
      const canvas = await html2canvas(element, {
        backgroundColor: '#ffffff',
        scale: 3,
        useCORS: true,
        allowTaint: false,
        width: element.offsetWidth,
        height: element.offsetHeight,
        scrollX: 0,
        scrollY: 0
      });

      // Restore original styles
      element.style.backgroundColor = originalStyles.backgroundColor;
      element.style.color = originalStyles.color;
      
      originalChildStyles.forEach(({ element, color, backgroundColor }) => {
        element.style.color = color;
        element.style.backgroundColor = backgroundColor;
      });

      // Convert to image and download
      const link = document.createElement('a');
      link.download = `betty-organic-invoice-${order.display_id || order.id}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
    } catch (error) {
      console.error('Error downloading image:', error);
      alert('Download failed. Please try again.');
    }
  };


  const handleShare = async () => {
    try {
      // Generate the image first
      const html2canvas = (await import('html2canvas')).default;
      const element = document.querySelector('.download-content') as HTMLElement;
      
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
        backgroundColor: '#ffffff', // Always white background for sharing
        scale: 3, // Higher quality for sharing
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

      const file = new File([blob], `betty-organic-invoice-${order.display_id || order.id}.png`, {
        type: 'image/png'
      });

      // Simple share text for receipt
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const shareText = isLocalhost 
        ? `🛍️ My Betty Organics receipt for Order #${order.display_id || order.id}\n\n💰 Total: ${total.toFixed(2)} ETB\n📧 Visit Betty Organics for more!`
        : `🛍️ My Betty Organics receipt for Order #${order.display_id || order.id}\n\n📥 View receipt: ${window.location.origin}/public/receipt/${order.display_id || order.id}`;

      // Always try native device sharing first - works with ALL apps user has
      if (navigator.share) {
        // Try with image first
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: 'Betty Organic Invoice',
            text: shareText,
            files: [file]
          });
        } else {
          // Fallback to text-only native sharing
          await navigator.share({
            title: 'Betty Organic Invoice',
            text: shareText
          });
        }
      } else {
        // If no native sharing, just download the image
        const link = document.createElement('a');
        link.download = `betty-organic-invoice-${order.display_id || order.id}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        
        alert('Receipt image downloaded! You can now share it using any app you prefer.');
      }

    } catch (error) {
      console.error('Error sharing:', error);
      alert('Sharing not available. Please use the Download button instead.');
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
        <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
          <DialogHeader className="no-print">
            <DialogTitle>Download Invoice</DialogTitle>
          </DialogHeader>

          {/* Downloadable content for social media */}
          <div className="download-content bg-background border border-border/30 p-6 rounded-xl shadow-sm mx-auto max-w-sm">
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold text-foreground">Receipt</h2>
              <p className="text-sm text-muted-foreground">
                Thank you for your purchase!
              </p>
            </div>
            {customerInfo && (
              <div className="mb-4 text-center">
                <p className="text-sm text-foreground">Customer Info: {customerInfo}</p>
              </div>
            )}
            <div className="mb-4">
              <h3 className="font-semibold mb-2 text-foreground">Items:</h3>
              <ul className="space-y-1">
                {items.map((item, index) => (
                  <li key={index} className="flex justify-between text-sm gap-2 text-foreground">
                    <span className="flex-1 text-left">
                      {item.name} x{item.quantity.toFixed(3)}kg
                    </span>
                    <span className="font-medium whitespace-nowrap">
                      {item.price.toFixed(2)} ETB
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex justify-between font-bold mb-4 text-foreground">
              <span>Total:</span>
              <span>{total.toFixed(2)} ETB</span>
            </div>
            <div className="flex justify-center mb-4">
              <Barcode value={`ORDER-${order.display_id || order.id}`} width={1} height={40} />
            </div>
            <div className="text-center text-xs text-muted-foreground">
              <p className="break-all">Order ID: {order.display_id || order.id}</p>
              <p>{new Date().toLocaleString()}</p>
            </div>
          </div>

          {/* Mobile-friendly controls for social media sharing */}
          <div className="flex flex-col sm:flex-row gap-3 mt-6 no-print">
            <Button onClick={handleDownload} className="flex-1 bg-green-600 hover:bg-green-700">
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
            <div className="flex gap-2 flex-1">
              <Button onClick={handlePrint} variant="outline" className="flex-1">
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>
              <Button onClick={handleShare} variant="outline" className="flex-1">
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DownloadInvoiceModal;