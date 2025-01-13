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
import { useToast } from "@/hooks/use-toast";
import { Share2 } from "lucide-react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

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
  total,
}: ConfirmPurchaseDialogProps) {
  const { toast } = useToast();

  const handleCheckout = async () => {
    const supabase = createClientComponentClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const user = session?.user;

    if (!user) {
      toast({
        title: "Unauthorized",
        description: "You must be logged in to place an order.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from("orders")
        .insert({
          customer_id: user.id,
          total_amount: total,
          status: "pending",
          type: "online", // or whatever type you're using
        })
        .select()
        .single();

      if (error) throw error;

      // Handle success
      console.log("Order created:", data);
      toast({
        title: "Order placed successfully",
        description: "Your order has been submitted and is being processed",
      });
      onOpenChange(false);
      // Clear cart and show success message
    } catch (error) {
      console.error("Error creating order:", error);
      toast({
        title: "Error placing order",
        description:
          error instanceof Error ? error.message : "Failed to place order",
        variant: "destructive",
      });
      // Show error message to user
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Orders</DialogTitle>
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
          <Button
            variant="outline"
            onClick={() => {
              const message = `I just placed an order for ${items.length} items totaling ETB ${total.toFixed(2)}!`;
              const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
              window.open(url, "_blank");
            }}
          >
            <Share2 className="mr-2 h-4 w-4" />
            Share via WhatsApp
          </Button>
          <Button onClick={handleCheckout}>
            Confirm Orders
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
