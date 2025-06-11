import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Barcode from "react-barcode";
import { Printer, MessageCircle } from "lucide-react";

interface OrderReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: { name: string; quantity: number; price: number }[];
  total: number;
  customerInfo?: string;
  orderId?: string;
}

export const OrderReceiptModal: React.FC<OrderReceiptModalProps> = ({
  isOpen,
  onClose,
  items,
  total,
  customerInfo,
  orderId,
}) => {
  console.log('[RECEIPT] Modal render - isOpen:', isOpen, 'items:', items?.length, 'total:', total);
  const handlePrint = () => {
    window.print();
  };

  const generateShareText = () => {
    const storeName = "Betty Organic";

    let text = `🛍️ *Order Receipt - ${storeName}*\n`;
    text += `🧾 Order ID: ${orderId}\n\n`;
    text += "🛒 Items Ordered:\n";
    items.forEach((item, index) => {
      text += `${index + 1}. ${item.name} (${(item.quantity * 1000).toFixed(0)}g) - ETB ${item.price.toFixed(2)}\n`;
    });
    text += `\n💰 Total: ETB ${total.toFixed(2)}\n\n`;
    if (customerInfo) {
      text += `📞 Customer: ${customerInfo}\n`;
    }
    text += `🕒 Order Time: ${new Date().toLocaleString()}\n\n`;
    text += `🌿 Thank you for choosing organic! 🌿\n`;
    text += `🔗 Visit us: ${window.location.origin}`;
    return encodeURIComponent(text);
  };

  const handleShareWhatsApp = () => {
    const text = generateShareText();
    const url = `https://api.whatsapp.com/send?text=${text}`;
    window.open(url, "_blank");
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
        <DialogContent className="sm:max-w-[425px] z-[60]">
          <DialogHeader className="no-print">
            <DialogTitle>Order Receipt</DialogTitle>
          </DialogHeader>

          {/* Printable content */}
          <div className="print-content border p-4 rounded bg-white">
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold">Betty Organic</h2>
              <p className="text-sm text-gray-500">
                Fresh Organic Fruits & Vegetables
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Thank you for your order!
              </p>
            </div>
            
            {customerInfo && (
              <div className="mb-4 text-center border-b pb-2">
                <p className="text-sm font-medium">Customer: {customerInfo}</p>
                {orderId && <p className="text-sm text-gray-600">Order ID: {orderId}</p>}
              </div>
            )}
            
            <div className="mb-4">
              <h3 className="font-semibold mb-2 text-gray-800">Order Items:</h3>
              <ul className="space-y-1">
                {items.map((item, index) => (
                  <li key={index} className="flex justify-between text-sm border-b border-gray-100 pb-1">
                    <span>
                      {item.name} ({(item.quantity * 1000).toFixed(0)}g)
                    </span>
                    <span className="font-medium">ETB {item.price.toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="flex justify-between font-bold text-lg mb-4 border-t pt-2">
              <span>Total Amount:</span>
              <span>ETB {total.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-center mb-4">
              <Barcode value={orderId || `ORDER-${Date.now()}`} width={1.5} height={50} />
            </div>
            
            <div className="text-center text-xs text-gray-500 border-t pt-2">
              <p className="font-medium">Order Details</p>
              <p>Date: {new Date().toLocaleDateString()}</p>
              <p>Time: {new Date().toLocaleTimeString()}</p>
              <p className="mt-2 text-green-600">🌿 Fresh • Organic • Healthy 🌿</p>
            </div>
          </div>

          {/* Non-printable controls */}
          <div className="flex justify-end mt-4 space-x-2 no-print">
            <Button onClick={handlePrint} className="gap-2">
              <Printer className="h-4 w-4" />
              Print Receipt
            </Button>
            <Button variant="outline" onClick={handleShareWhatsApp} className="gap-2">
              <MessageCircle className="h-4 w-4" />
              Share on WhatsApp
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default OrderReceiptModal;