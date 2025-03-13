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
import { OrderConfirmationReceipt } from './OrderConfirmationReceipt';

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

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setError(null);
      setIsSubmitting(false);
    }
  }, [open]);

  // Reset completion state when dialog closes
  useEffect(() => {
    if (!open) {
      setOrderComplete(false);
      setOrderDetails(null);
      setCompletedOrderData(null);
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
      setIsSubmitting(true);

      const orderTotal = calculateTotal(items);

      // Validate items
      if (!items?.length) {
        throw new Error('Your cart is empty');
      }

      const { data: order, error: orderError } = await handlePurchaseOrder(items, orderTotal);

      if (orderError || !order) {
        throw new Error(typeof orderError === 'string' ? orderError : 'Failed to create order');
      }

      // Set completed order data before clearing cart
      setCompletedOrderData({
        items: [...items],
        total: orderTotal
      });

      setOrderDetails(order);
      setOrderComplete(true);

      // Clear cart after setting all state
      clearCart();

      toast({
        title: 'Success',
        description: 'Order placed successfully!',
      });

    } catch (err: unknown) {
      setIsSubmitting(false);

      let errorMessage = 'An unexpected error occurred during checkout';
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'object' && err !== null) {
        errorMessage = JSON.stringify(err);
      }

      setError(errorMessage);
      toast({
        title: 'Checkout Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
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
    <Dialog
      open={open}
      onOpenChange={(open) => {
        if (!open && isSubmitting) {
          if (confirm("Are you sure you want to cancel? Your order is being processed.")) {
            setIsSubmitting(false);
          } else {
            return;
          }
        }
        onOpenChange(open);
      }}
    >
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

            <DialogFooter className="gap-2 mt-6">
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
          orderDetails && completedOrderData && (
            <OrderConfirmationReceipt
              orderNumber={orderDetails?.display_id || orderDetails?.id || ''}
              orderDate={new Date()}
              items={completedOrderData.items}
              total={completedOrderData.total}
              onClose={() => {
                onOpenChange(false);
              }}
            />
          )
        )}
      </DialogContent>
    </Dialog>
  );
}
