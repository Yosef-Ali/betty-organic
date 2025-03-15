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

  const handleConfirm = async () => {
    try {
      setIsSubmitting(true);
      console.log("[DEBUG] Starting order confirmation with:", {
        itemCount: items.length,
        total
      });

      if (!items.length) {
        throw new Error("No items in cart");
      }

      const result = await handlePurchaseOrder(items, total);
      console.log("[DEBUG] Purchase order result:", result);

      if (!result.data) {
        throw new Error(result.error || "Failed to create order");
      }

      toast.success("Order created successfully!");

      if (clearCart) {
        clearCart();
      }
      onClose();
    } catch (error) {
      console.error("[DEBUG] Error placing order:", error);
      toast.error(error instanceof Error ? error.message : "Failed to place order");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md z-[100]">
        <DialogHeader>
          <DialogTitle>Confirm Your Order</DialogTitle>
          <DialogDescription>
            Please review your order details before confirming.
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
            {isSubmitting ? "Processing..." : "Confirm Order"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
