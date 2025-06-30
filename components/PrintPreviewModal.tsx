import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Barcode from "react-barcode";
import { Printer, Share2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: { name: string; quantity: number; price: number }[];
  total: number;
  customerInfo?: string;
  customerId?: string;
}

export const PrintPreviewModal: React.FC<PrintPreviewModalProps> = ({
  isOpen,
  onClose,
  items,
  total,
  customerInfo,
  customerId,
}) => {
  const handlePrint = () => {
    window.print();
  };

  const generateShareText = () => {
    const storeName = "Betty Organics";
    const orderNumber = Date.now().toString().slice(-6);

    let text = `🛍️ Just shopped at ${storeName}!\n`;
    text += `🧾 Order #${orderNumber}\n\n`;
    text += "🛒 My haul:\n";
    items.forEach((item, index) => {
      text += `${index + 1}. ${item.name} (${item.quantity.toFixed(3)}kg) - $${item.price.toFixed(2)}\n`;
    });
    text += `\n💰 Total spent: $${total.toFixed(2)}\n\n\n#HealthyChoices\n\n`;
    if (customerInfo) {
      text += `📞 Contact: ${customerInfo}\n\n`;
    }
    text += `🕒 ${new Date().toLocaleString()}\n`;
    text += `🔗 Check them out: ${window.location.origin}`;
    return encodeURIComponent(text);
  };

  const handleShare = (platform: "telegram" | "whatsapp") => {
    const text = generateShareText();
    const url =
      platform === "telegram"
        ? `https://t.me/share/url?url=${window.location.href}&text=${text}`
        : `https://api.whatsapp.com/send?text=${text}`;
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
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader className="no-print">
            <DialogTitle>Thermal Print Preview</DialogTitle>
          </DialogHeader>

          {/* Printable content */}
          <div className="print-content border p-4 rounded">
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold">Receipt</h2>
              <p className="text-sm text-gray-500">
                Thank you for your purchase!
              </p>
            </div>
            {customerInfo && (
              <div className="mb-4 text-center">
                <p className="text-sm">Customer Info: {customerInfo}</p>
                {customerId && <p className="text-sm">Customer ID: {customerId}</p>}
              </div>
            )}
            <div className="mb-4">
              <h3 className="font-semibold mb-2">Items:</h3>
              <ul className="space-y-1">
                {items.map((item, index) => (
                  <li key={index} className="flex justify-between text-sm">
                    <span>
                      {item.name} x{item.quantity.toFixed(3)}kg
                    </span>
                    <span>${item.price.toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex justify-between font-bold mb-4">
              <span>Total:</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <div className="flex justify-center mb-4">
              <Barcode value={`ORDER-${Date.now()}`} width={1.5} height={50} />
            </div>
            <div className="text-center text-xs text-gray-500">
              <p>Order ID: {Date.now()}</p>
              <p>{new Date().toLocaleString()}</p>
            </div>
          </div>

          {/* Non-printable controls */}
          <div className="flex justify-end mt-4 space-x-2 no-print">
            <Button onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleShare("telegram")}>
                  Share on Telegram
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleShare("whatsapp")}>
                  Share on WhatsApp
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PrintPreviewModal;
