'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CartItemType } from "@/types/cart";
import { useState } from "react";
import { useMarketingCartStore } from "@/store/cartStore";
import { ScrollArea } from "@/components/ui/scroll-area";
import { handlePurchaseOrder } from "@/app/actions/purchaseActions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
// import { useAuth } from "@/components/providers/AuthProvider"; // No longer strictly needed for confirmation logic
import { sendWhatsAppOrderNotification } from "@/app/(marketing)/actions/notificationActions";

interface ConfirmPurchaseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItemType[];
  total: number;
}

export const ConfirmPurchaseDialog = ({
  isOpen,
  onClose,
  items,
  total,
}: ConfirmPurchaseDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const clearCart = useMarketingCartStore((state) => state.clearCart);
  const router = useRouter();
  // const { user } = useAuth(); // We'll handle guest orders now

  const handleConfirm = async () => {
    try {
      // Guest checkout is now allowed, remove the sign-in check

      setIsSubmitting(true);

      if (!items.length) {
        throw new Error("No items in cart");
      }

      const result = await handlePurchaseOrder(items, total);

      if (!result.data) {
        throw new Error(result.error || "Failed to create order");
      }

      const orderId = result.data.id;
      const orderDetails = {
        id: orderId,
        items: items.map(item => ({ name: item.name, grams: item.grams, price: ((item.pricePerKg * item.grams) / 1000) })),
        total: total,
        // Add customer info if available (e.g., from user object or guest input)
        // customerName: user?.user_metadata?.full_name || 'Guest',
        // customerPhone: user?.phone || 'N/A',
      };

      // Show success message
      toast.success(`Order #${orderId} created successfully! Thank you for your purchase!`);

      // Send WhatsApp notification (fire and forget)
      sendWhatsAppOrderNotification(orderDetails).catch((err: Error) => {
        console.error("Failed to send WhatsApp notification:", err.message);
        toast.error("Order placed successfully, but failed to send notification to admin.");
        // toast.error("Failed to send order notification.");
      });


      // Clear the cart and close the dialog
      clearCart();
      onClose();

      // Refresh the page to reflect changes (optional)
      router.refresh();
    } catch (error) {
      console.error("Error placing order:", error);
      toast.error(error instanceof Error ? error.message : "Failed to place order");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md z-[100]">
        <DialogHeader>
          <DialogTitle>
            Confirm Your Order
          </DialogTitle>
          <DialogDescription>
            Please review your order details before confirming. The order will be sent to our admin via WhatsApp.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[300px] mt-4">
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between items-center py-2 border-b">
                <div className="flex flex-col">
                  <span className="font-medium">{item.name}</span>
                  <span className="text-sm text-gray-500">{item.grams}g</span>
                </div>
                <span className="font-medium">ETB {((item.pricePerKg * item.grams) / 1000).toFixed(2)}</span>
              </div>
            ))}
            <div className="pt-4 border-t flex justify-between font-bold">
              <span>Total:</span>
              <span>ETB {total.toFixed(2)}</span>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="flex sm:justify-between gap-4 sm:gap-0">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isSubmitting}>
            {isSubmitting ? "Processing..." : "Confirm Order"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
