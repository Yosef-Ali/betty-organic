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
import { useState } from "react";

import { createOrder } from '@/app/actions/orderActions';
import type { Order } from "@/types/order";
import { Share2 } from "lucide-react";
import { useMarketingCartStore } from "@/store/cartStore";
import { useAuthContext } from "@/contexts/auth/AuthContext";
import { Alert, AlertDescription } from "@/components/ui/alert"

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
  const { profile, isAuthenticated, loading } = useAuthContext();
  const clearCart = useMarketingCartStore(state => state.clearCart);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async () => {
    try {
      setError(null);

      if (loading) {
        toast({
          title: "Please wait",
          description: "Checking authentication status...",
          variant: "default",
        });
        return;
      }

      if (!isAuthenticated || !profile) {
        toast({
          title: "Sign in Required",
          description: "Please sign in first to place orders. Your cart will be saved automatically.",
          variant: "default",
        });
        router.push('/auth/login');
        onOpenChange(false);
        return;
      }

      // Create order data
      const orderData: Order = {
        id: crypto.randomUUID(),
        customer_id: profile.id,
        status: "pending",
        type: "online",
        total_amount: Number(total.toFixed(2)),
        order_items: items.map(item => ({
          id: crypto.randomUUID(),
          product_id: item.id,
          quantity: Math.max(1, Math.round(item.grams / 1000)),
          price: Number((item.pricePerKg * item.grams / 1000).toFixed(2)),
          product_name: item.name
        }))
      };

      // Create order
      const { data: order, error: orderError } = await createOrder(orderData);

      if (orderError) {
        console.error('Order creation failed:', orderError);
        throw new Error(orderError.message || 'Failed to create order');
      }

      if (!order) {
        throw new Error('No order data returned');
      }

      // Clear cart and close dialog
      clearCart();
      onOpenChange(false);

      // Show success message
      toast({
        title: "Order Confirmed!",
        description: "Thank you for your order. We will contact you soon about delivery details.",
        duration: 5000,
      });

    } catch (err: unknown) {
      const e = err as Error & {
        code?: string;
        details?: string;
        hint?: string;
      };

      let errorMessage = 'An unexpected error occurred during checkout';

      if (e.message && e.message !== '{}') {
        errorMessage = e.message;
      } else if (e.code) {
        errorMessage = `Error ${e.code}: ${e.details || 'Unknown error'}`;
      } else if (typeof err === 'object' && err !== null) {
        errorMessage = JSON.stringify(err, null, 2);
      }

      console.error('Checkout error:', {
        message: e.message,
        code: e.code,
        details: e.details,
        stack: e.stack
      });

      setError(errorMessage);

      toast({
        title: "Checkout Error",
        description: errorMessage,
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
        <div className="space-y-4">
          <p className="font-medium text-lg">Total: ETB {total.toFixed(2)}</p>
          <div className="text-sm text-gray-500">
            <p>Order Summary:</p>
            <ul className="list-disc pl-5 mt-2">
              {items.map(item => (
                <li key={item.id} className="text-sm">
                  {item.name} - {item.grams}g
                </li>
              ))}
            </ul>
          </div>
        </div>
        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
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
