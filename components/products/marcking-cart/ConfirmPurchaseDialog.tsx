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
import { useAuth } from "@/components/providers/AuthProvider";

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
  const { user } = useAuth();

  const handleConfirm = async () => {
    try {
      // Check if user is signed in
      if (!user) {
        // Store cart items in session storage before redirecting
        sessionStorage.setItem('pendingOrder', JSON.stringify({ items, total }));
        // Redirect to sign in page with return URL
        router.push(`/auth/login?returnTo=${encodeURIComponent('/marketing')}`);
        onClose();
        return;
      }

      setIsSubmitting(true);

      if (!items.length) {
        throw new Error("No items in cart");
      }

      const result = await handlePurchaseOrder(items, total);

      if (!result.data) {
        throw new Error(result.error || "Failed to create order");
      }

      // Show success message with order ID
      toast.success(`Order #${result.data.id} created successfully! Thank you for your purchase!`);

      // Clear the cart and close the dialog
      clearCart();
      onClose();

      // Stay on the marketing page
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
            {user ? "Confirm Your Order" : "Sign In Required"}
          </DialogTitle>
          <DialogDescription>
            {user
              ? "Please review your order details before confirming."
              : "You need to sign in to complete your order. Click confirm to proceed to sign in."}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[300px] mt-4">
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between">
                <span>{item.name} ({item.grams}g)</span>
                <span>ETB {((item.pricePerKg * item.grams) / 1000).toFixed(2)}</span>
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
            {isSubmitting ? "Processing..." : user ? "Confirm Order" : "Sign In to Continue"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
