'use client';

import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { handlePurchaseOrder } from '@/app/actions/purchaseActions';
import { createClient } from '@/lib/supabase/client';
import type { Order } from '@/types/order';
import { Share2 } from 'lucide-react';
import { useMarketingCartStore } from '@/store/cartStore';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { OrderConfirmationReceipt } from '@/components/products/marcking-cart/OrderConfirmationReceipt';

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
  const clearCart = useMarketingCartStore(state => state.clearCart);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderDetails, setOrderDetails] = useState<Order | null>(null);
  const [completedOrderData, setCompletedOrderData] = useState<{
    items: typeof items;
    total: number;
  } | null>(null);

  // Calculate total from items
  const calculateTotal = (orderItems: typeof items) => {
    return orderItems.reduce(
      (sum, item) => sum + (item.pricePerKg * item.grams) / 1000,
      0
    );
  };

  const handleCheckout = async () => {
    try {
      setError(null);
      setIsSubmitting(true);

      const orderTotal = calculateTotal(items);
      console.log("Starting checkout with total:", orderTotal);

      const {
        data: order,
        error,
        status,
      } = await handlePurchaseOrder(items, orderTotal);

      if (error) {
        if (status === 401) {
          router.push(
            `/auth/login?return_url=${encodeURIComponent(window.location.pathname)}`,
          );
          return;
        }
        throw new Error(error);
      }

      if (!order) {
        throw new Error('No order data returned');
      }

      // Save the completed order data before clearing the cart
      setCompletedOrderData({
        items: [...items],
        total: orderTotal
      });

      setOrderDetails(order);
      setOrderComplete(true);
      setIsSubmitting(false);

      // Clear cart after setting all state
      clearCart();

      toast({
        title: 'Success',
        description: 'Order placed successfully!',
        variant: 'default',
      });

    } catch (err: unknown) {
      setIsSubmitting(false);
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
      } else if (err instanceof Error) {
        errorMessage = err.message || 'Unknown error occurred';
      } else if (typeof err === 'object' && err !== null) {
        errorMessage = JSON.stringify(err, null, 2);
      }

      setError(errorMessage);
      toast({
        title: 'Checkout Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const handleCancel = () => {
    if (isSubmitting) {
      if (confirm("Are you sure you want to cancel? Your order is being processed.")) {
        setIsSubmitting(false);
        onOpenChange(false);
      }
    } else {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open && isSubmitting) {
        if (confirm("Are you sure you want to cancel? Your order is being processed.")) {
          setIsSubmitting(false);
        } else {
          return;
        }
      }

      if (!open && orderComplete) {
        setOrderComplete(false);
        setOrderDetails(null);
        setCompletedOrderData(null);
      }

      onOpenChange(open);
    }}>
      <DialogContent>
        {!orderComplete ? (
          <>
            <DialogHeader>
              <DialogTitle>Confirm Order</DialogTitle>
              <DialogDescription>
                Are you sure you want to place this order?
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <p className="font-medium text-lg">
                Total: ETB {calculateTotal(items).toFixed(2)}
              </p>
              <div className="text-sm text-muted-foreground">
                <p className="font-medium">Order Summary:</p>
                <ul className="divide-y divide-border mt-2">
                  {items.map(item => (
                    <li key={item.id} className="py-2 flex justify-between">
                      <span>{item.name} - {item.grams}g</span>
                      <span>ETB {((item.pricePerKg * item.grams) / 1000).toFixed(2)}</span>
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
              <Button
                variant="outline"
                onClick={handleCancel}
                type="button"
              >
                Cancel
              </Button>
              {/* <Button
                variant="outline"
                disabled={isSubmitting}
                onClick={() => {
                  const message = `I just placed an order for ${items.length} items totaling ETB ${calculateTotal(items).toFixed(2)}!`;
                  const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
                  window.open(url, '_blank');
                }}
              >
                <Share2 className="mr-2 h-4 w-4" />
                Share via WhatsApp
              </Button> */}
              <Button
                onClick={handleCheckout}
                disabled={isSubmitting}
                className="relative"
              >
                {isSubmitting && (
                  <span className="absolute inset-0 flex items-center justify-center bg-primary">
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  </span>
                )}
                <span className={isSubmitting ? "invisible" : ""}>
                  {isSubmitting ? 'Processing...' : 'Confirm Order'}
                </span>
              </Button>
            </DialogFooter>
          </>
        ) : (
          <OrderConfirmationReceipt
            orderNumber={orderDetails?.id || ''}
            orderDate={new Date()}
            items={completedOrderData?.items || []}
            total={completedOrderData?.total || 0}
            onClose={() => {
              onOpenChange(false);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
