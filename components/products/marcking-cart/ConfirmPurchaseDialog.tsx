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
  const [debug, setDebug] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderDetails, setOrderDetails] = useState<Order | null>(null);
  const [completedOrderData, setCompletedOrderData] = useState<{
    items: typeof items;
    total: number;
  } | null>(null);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setError(null);
      setDebug(null);
      setIsSubmitting(false);
    }
  }, [open]);

  const calculateTotal = (orderItems: typeof items) => {
    return orderItems.reduce(
      (sum, item) => sum + (item.pricePerKg * item.grams) / 1000,
      0
    );
  };

  const handleCheckout = async () => {
    try {
      setError(null);
      setDebug('Starting checkout process...');
      setIsSubmitting(true);

      const orderTotal = calculateTotal(items);
      setDebug(`Calculated total: ${orderTotal}`);

      // Validate items first
      if (!items.length) {
        throw new Error('Your cart is empty');
      }

      setDebug('Creating order...');
      const {
        data: order,
        error,
        status,
      } = await handlePurchaseOrder(items, orderTotal);

      if (!order) {
        throw new Error('No order data returned');
      }

      setDebug(`Order created successfully! ID: ${order.id}`);

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
      setDebug(`Full error details: ${JSON.stringify(err, null, 2)}`);
      
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
                Please review your order details below
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="bg-muted/30 p-4 rounded-lg">
                <p className="font-semibold text-lg">
                  Total: ETB {calculateTotal(items).toFixed(2)}
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Order Summary:</h4>
                <ul className="divide-y divide-border">
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

            {debug && process.env.NODE_ENV === 'development' && (
              <div className="mt-2 text-xs text-muted-foreground">
                <details>
                  <summary>Debug Info</summary>
                  <pre className="mt-2 whitespace-pre-wrap break-all bg-muted p-2 rounded">
                    {debug}
                  </pre>
                </details>
              </div>
            )}

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={handleCancel}
                type="button"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCheckout}
                disabled={isSubmitting}
                className="relative"
              >
                {isSubmitting ? (
                  <>
                    <span className="opacity-0">Confirm Order</span>
                    <span className="absolute inset-0 flex items-center justify-center">
                      Processing...
                    </span>
                  </>
                ) : (
                  'Confirm Order'
                )}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <OrderConfirmationReceipt
            orderNumber={orderDetails?.display_id || orderDetails?.id || ''}
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
