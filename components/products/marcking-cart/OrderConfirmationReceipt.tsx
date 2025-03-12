import { Button } from "@/components/ui/button";
import { Check, Mail, Share2, Copy, ClipboardCheck } from "lucide-react";
import { formatDate, formatOrderId } from "@/lib/utils";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import Link from "next/link";

interface OrderConfirmationReceiptProps {
  orderNumber: string;
  orderDate: Date;
  items: Array<{
    name: string;
    grams: number;
    pricePerKg: number;
  }>;
  total: number;
  onClose: () => void;
}

export function OrderConfirmationReceipt({
  orderNumber,
  orderDate,
  items,
  total,
  onClose
}: OrderConfirmationReceiptProps) {
  // Always calculate the total from items to ensure accuracy
  const displayTotal = items.reduce(
    (sum, item) => sum + (item.pricePerKg * item.grams) / 1000,
    0
  );

  // Debug logging
  useEffect(() => {
    console.log("Order Receipt Details:", {
      orderNumber,
      itemCount: items.length,
      items,
      calculatedTotal: displayTotal,
      passedTotal: total
    });
  }, [orderNumber, items, displayTotal, total]);

  // Email sharing functionality
  const [email, setEmail] = useState('');
  const [isEmailInputVisible, setIsEmailInputVisible] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Create formatted content for email or clipboard
  const createEmailContent = (forClipboard = false) => {
    const formattedOrderId = formatOrderId(orderNumber);
    const content = `
Betty Organic - Order Confirmation
--------------------------------
Order ID: ${formattedOrderId}
Date: ${formatDate(orderDate.toISOString())}

Items:
${items.map(item => `- ${item.name}: ${item.grams}g (${item.pricePerKg} Br/kg)`).join('\n')}

Total: ${displayTotal.toFixed(2)} Br

Thank you for shopping with Betty Organic!
    `.trim();

    return content;
  };

  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSending(true);

    // Try to send via mailto
    const content = createEmailContent();
    window.location.href = `mailto:${email}?subject=Order Confirmation - ${formatOrderId(orderNumber)}&body=${encodeURIComponent(content)}`;

    // Show success message after a short delay
    setTimeout(() => {
      setIsSending(false);
      setEmailSent(true);
      setIsEmailInputVisible(false);
    }, 1000);
  };

  const handleCopyToClipboard = () => {
    const content = createEmailContent(true);
    const fullText = `${content}`;

    navigator.clipboard.writeText(fullText)
      .then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 3000);
      })
      .catch(err => {
        console.error('Failed to copy text: ', err);
      });
  };

  return (
    <div className="space-y-6 p-4">
      <DialogHeader>
        <DialogTitle className="text-xl font-semibold">
          Order Confirmation - {formatOrderId(orderNumber)}
        </DialogTitle>
      </DialogHeader>

      <div className="flex flex-col items-center justify-center text-center">
        <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
          <Check className="h-6 w-6 text-green-600" />
        </div>
        <h3 className="text-xl font-bold">Order Confirmed!</h3>
        <p className="text-muted-foreground mt-1">Order #{orderNumber}</p>
        <p className="text-muted-foreground text-sm">
          {formatDate(orderDate.toISOString())}
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          You can track this order in your{" "}
          <Link
            href="/dashboard/profile"
            className="text-primary hover:underline font-medium"
          >
            profile dashboard
          </Link>
        </p>
      </div>

      {/* Order Total */}
      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
        <div className="flex justify-between items-center">
          <span className="font-semibold text-lg">Total Amount:</span>
          <span className="font-bold text-2xl text-green-700">
            ETB {displayTotal.toFixed(2)}
          </span>
        </div>
      </div>

      <div className="rounded-lg border p-4">
        <div className="space-y-2">
          <h4 className="font-medium pb-2 border-b">Order Details</h4>
          {items.map((item, index) => (
            <div key={index} className="flex justify-between text-sm">
              <span>{item.name} ({item.grams}g)</span>
              <span>ETB {((item.pricePerKg * item.grams) / 1000).toFixed(2)}</span>
            </div>
          ))}
          <div className="border-t pt-2 mt-2 flex justify-between font-medium">
            <span>Subtotal</span>
            <span>ETB {displayTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {isEmailInputVisible ? (
          <form onSubmit={handleSendEmail} className="flex flex-col gap-2">
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter your email"
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
              <Button
                type="submit"
                variant="outline"
                size="sm"
                disabled={isSending}
              >
                {isSending ? "Sending..." : "Send"}
              </Button>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsEmailInputVisible(false)}
              className="self-end text-xs"
            >
              Cancel
            </Button>
          </form>
        ) : (
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex items-center justify-center flex-1"
              onClick={() => setIsEmailInputVisible(true)}
              disabled={emailSent}
            >
              <Mail className="mr-2 h-4 w-4" />
              {emailSent ? "Email Sent!" : "Email Receipt"}
            </Button>

            <Button
              variant="outline"
              className="flex items-center justify-center"
              onClick={handleCopyToClipboard}
              title="Copy receipt to clipboard"
            >
              {isCopied ? (
                <ClipboardCheck className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        )}

        <Button
          variant="outline"
          className="flex items-center justify-center w-full"
          onClick={() => {
            const message = `I just placed order #${orderNumber} for ${items.length} items totaling ETB ${displayTotal.toFixed(2)}!`;
            const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
            window.open(url, '_blank');
          }}
        >
          <Share2 className="mr-2 h-4 w-4" />
          Share via WhatsApp
        </Button>

        <Button
          onClick={onClose}
          className="w-full"
        >
          Continue Shopping
        </Button>
      </div>
    </div>
  );
}
