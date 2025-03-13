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
import { useAuth } from '@/hooks/useAuth';
import { AlertCircle } from 'lucide-react';
import { AlertTitle } from '@/components/ui/alert';

interface ConfirmPurchaseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  items: {
    id: string;
    name: string;
    pricePerKg: number;
    grams: number;
  }[];
  total: number;
}

export function ConfirmPurchaseDialog({ isOpen, onClose, items, total }: ConfirmPurchaseDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useAuth();
  const clearCart = useMarketingCartStore(state => state.clearCart);
  const [error, setError] = useState<string | null>(null);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderDetails, setOrderDetails] = useState<Order | null>(null);
  const [completedOrderData, setCompletedOrderData] = useState<{
    items: typeof items;
    total: number;
  } | null>(null);

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setError(null);
    }
  }, [isOpen]);

  // Reset completion state when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setOrderComplete(false);
      setOrderDetails(null);
      setCompletedOrderData(null);
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    if (!user) {
      toast({
        title: "Sign in Required",
        description: "Please sign in to place your order. You'll be redirected to the sign-in page.",
        variant: "default",
      });
      router.push('/auth/login');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Validate items
      if (!items?.length) {
        throw new Error('Your cart is empty');
      }

      // Validate each item
      items.forEach(item => {
        if (!item.id || !item.name || item.pricePerKg <= 0 || item.grams <= 0) {
          throw new Error(`Invalid item data: ${item.name || 'Unknown item'}`);
        }
      });

      console.log('Submitting order with items:', JSON.stringify(items));
      const result = await handlePurchaseOrder(items, total);

      if (result.error) {
        throw new Error(result.error);
      }

      if (!result.data) {
        throw new Error('Failed to create order: No order data returned');
      }

      // Set completed order data before clearing cart
      setCompletedOrderData({
        items: [...items],
        total: total
      });

      setOrderDetails(result.data);
      setOrderComplete(true);

      // Clear cart after setting all state
      clearCart();

      toast({
        title: "Success",
        description: "Your order has been placed successfully!",
        variant: "default",
      });

    } catch (error) {
      console.error('Order error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        {!orderComplete ? (
          <>
            <DialogHeader>
              <DialogTitle>Confirm Purchase</DialogTitle>
              <DialogDescription>
                Please review your order details before confirming.
              </DialogDescription>
            </DialogHeader>

            {!user && (
              <Alert className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Sign in Required</AlertTitle>
                <AlertDescription>
                  You need to be signed in to place an order. Click the button below to sign in or create an account.
                </AlertDescription>
                <div className="mt-4 flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => router.push('/auth/login')}
                    className="w-full"
                  >
                    Sign in
                  </Button>
                  <Button
                    variant="default"
                    onClick={() => router.push('/auth/signup')}
                    className="w-full"
                  >
                    Create Account
                  </Button>
                </div>
              </Alert>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium">Order Summary</h4>
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>{item.name}</span>
                    <span>{item.grams}g - ETB {((item.pricePerKg * item.grams) / 1000).toFixed(2)}</span>
                  </div>
                ))}
                <div className="flex justify-between font-medium pt-2 border-t">
                  <span>Total</span>
                  <span>ETB {total.toFixed(2)}</span>
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirm}
                  disabled={isLoading}
                  className={!user ? "bg-primary hover:bg-primary/90" : ""}
                >
                  {isLoading ? "Processing..." : user ? "Confirm Order" : "Sign in to Order"}
                </Button>
              </div>
            </div>
          </>
        ) : (
          orderDetails && completedOrderData && (
            <OrderConfirmationReceipt
              orderNumber={orderDetails?.display_id || orderDetails?.id || ''}
              orderDate={new Date()}
              items={completedOrderData.items}
              total={completedOrderData.total}
              onClose={onClose}
            />
          )
        )}
      </DialogContent>
    </Dialog>
  );
}
