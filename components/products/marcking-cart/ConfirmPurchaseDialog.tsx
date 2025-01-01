"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { createOrder } from "@/app/actions/orderActions"

interface ConfirmPurchaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: {
    id: string;
    name: string;
    pricePerKg: number;
    grams: number;
  }[];
  total: number;
}

export function ConfirmPurchaseDialog({
  open,
  onOpenChange,
  items,
  total
}: ConfirmPurchaseDialogProps) {
  const { toast } = useToast();

  const handlePurchase = async () => {
    try {
      const formData = new FormData();
      formData.append('status', 'pending');
      formData.append('type', 'online');
      formData.append('items', JSON.stringify(items.map(item => ({
        productId: item.id,
        quantity: item.grams / 1000,
        price: item.pricePerKg
      }))));
      formData.append('totalAmount', total.toString());

      await createOrder(formData);

      toast({
        title: "Order placed successfully",
        description: "Your order has been submitted and is being processed",
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error placing order",
        description: error instanceof Error ? error.message : "Failed to place order",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Purchase</DialogTitle>
          <DialogDescription>
            Are you sure you want to place this order?
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <p className="font-medium">Total: ETB {total.toFixed(2)}</p>
          <p className="text-sm text-gray-500">
            This will create a new order with {items.length} items
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handlePurchase}>
            Confirm Purchase
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
