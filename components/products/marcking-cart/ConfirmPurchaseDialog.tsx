"use client";

import { useRouter } from "next/navigation";
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
import { useUser } from '@/lib/hooks/useUser';

import { createOrder } from '@/app/actions/orderActions';
import type { Order } from "@/types/order";
import { Share2 } from "lucide-react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useMarketingCartStore } from "@/store/cartStore";
import { useAuth } from "@/lib/hooks/useAuth";

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
  const router = useRouter();
  const { user } = useUser();
  const { isAuthenticated } = useAuth();
  const supabase = createClientComponentClient();
  const clearCart = useMarketingCartStore(state => state.clearCart);

  const handleCheckout = async () => {
    // Check authentication only when trying to checkout
    if (!isAuthenticated || !user) {
      toast({
        title: "Sign in Required",
        description: "Please sign in first to place orders. Your cart will be saved automatically.",
        variant: "default",
      });

      router.push('/auth/login');
      onOpenChange(false);
      return;
    }

    try {
      // Create order using server action
      const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      const orderData: Order = {
        customer_id: user.id,
        status: "pending",
        type: "online",
        total_amount: Number(total.toFixed(2)),
        orderNumber: orderNumber,
        items: items.map(item => ({
          product_id: item.id,
          quantity: Math.max(1, Math.round(item.grams / 1000)),
          price: Number((item.pricePerKg * item.grams / 1000).toFixed(2)),
          name: item.name
        }))
      };

      const { data: order, error } = await createOrder(orderData);

      if (error) {
        console.error("Order creation error:", error);
        toast({
          title: "Order Creation Failed",
          description: error.message || "Failed to create order. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Clear cart first to ensure state is updated
      clearCart();

      // Then close the dialog which will trigger cart sheet closing
      onOpenChange(false);

      // Show success message after everything is closed
      setTimeout(() => {
        toast({
          title: "Order Confirmed! ",
          description: "Thank you for your order. We will contact you soon about delivery details.",
          duration: 5000,
        });
      }, 100);

    } catch (error: any) {
      console.error("Error creating order:", error);
      toast({
        title: "Order Failed",
        description: error?.message || "There was a problem placing your order. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Order</DialogTitle>
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
            Confirm Order
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
