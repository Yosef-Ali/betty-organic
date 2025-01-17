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
import { randomUUID } from 'crypto';
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useMarketingCartStore } from "@/store/cartStore";
import { useAuth } from "@/lib/hooks/useAuth";
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

interface CustomerError {
  message?: string;
  code?: string;
  details?: string;
}

export function ConfirmPurchaseDialog({
  open,
  onOpenChange,
  items,
  total,
}: ConfirmPurchaseDialogProps) {
  const { toast } = useToast();
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const supabase = createClientComponentClient();
  const clearCart = useMarketingCartStore(state => state.clearCart);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async () => {
    try {
      setError(null);

      if (isLoading) {
        toast({
          title: "Please wait",
          description: "Checking authentication status...",
          variant: "default",
        });
        return;
      }

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

      // First, get or create customer record
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      if (customerError) {
        throw new Error(customerError.message);
      }

      let customerId: string;

      // if customer is null, create a new record
      if (!customer) {
        const { data: newCustomer, error: createError } = await supabase
          .from('customers')
          .insert({
            id: user.id,
            full_name: user.email?.split('@')[0] || 'Customer',
            email: user.email || '',
            status: 'active',
            phone: user.phone || '',
            image_url: user.user_metadata?.avatar_url || null
          })
          .select('id')
          .single();

        if (createError) {
          throw new Error(createError.message);
        }
        customerId = newCustomer.id;
      } else {
        customerId = customer.id;
      }

      const orderData: Order = {
        id: crypto.randomUUID(),
        customer_id: customerId,
        status: "pending",
        type: "online",
        total_amount: Number(total.toFixed(2)),
        items: items.map(item => ({
          product_id: item.id,
          quantity: Math.max(1, Math.round(item.grams / 1000)),
          price: Number((item.pricePerKg * item.grams / 1000).toFixed(2)),
          name: item.name
        }))
      };

      console.log('Submitting order:', JSON.stringify(orderData, null, 2));
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
      setTimeout(() => {
        toast({
          title: "Order Confirmed!",
          description: "Thank you for your order. We will contact you soon about delivery details.",
          duration: 5000,
        });
      }, 100);

    } catch (err: unknown) {
      const e = err as Error & {
        code?: string;
        details?: string;
        hint?: string;
      };

      const errorMessage = e.message && e.message !== '{}'
        ? e.message
        : JSON.stringify(e) || 'An unexpected error occurred during checkout';

      console.error('Checkout error:', errorMessage);

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
