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
import { createOrder } from '@/app/actions/orderActions';
import { createClient } from '@/lib/supabase/client';
import type { Order } from '@/types/order';
import { Share2 } from 'lucide-react';
import { useMarketingCartStore } from '@/store/cartStore';
import { useAuthContext } from '@/contexts/auth/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const validateSession = async () => {
      if (open && !loading) {
        try {
          const supabase = createClient();
          const {
            data: { session },
            error,
          } = await supabase.auth.getSession();

          if (error) throw error;

          if (!session) {
            router.push(
              `/auth/login?return_url=${encodeURIComponent(
                window.location.pathname,
              )}`,
            );
            onOpenChange(false);
          }
        } catch (error) {
          console.error('Session validation error:', error);
          router.push('/auth/login');
          onOpenChange(false);
        }
      }
    };

    validateSession();
  }, [open, loading, router, onOpenChange]);

  const handleCheckout = async () => {
    try {
      setError(null);
      setIsSubmitting(true);

      if (!profile?.id) {
        throw new Error('User profile not loaded. Please refresh the page.');
      }

      const orderData: Order = {
        id: crypto.randomUUID(),
        customer_id: profile.id,
        status: 'pending',
        type: 'online',
        total_amount: Number(total.toFixed(2)),
        order_items: items.map(item => ({
          id: crypto.randomUUID(),
          product_id: item.id,
          quantity: Math.max(1, Math.round(item.grams / 1000)),
          price: Number(((item.pricePerKg * item.grams) / 1000).toFixed(2)),
          product_name: item.name,
        })),
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
        title: 'Success',
        description: 'Order placed successfully!',
        variant: 'default',
      });

      // Redirect to order confirmation or orders page
      router.push('/dashboard/orders');

      console.log('Order successfully created:', order);
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
      } else if (typeof err === 'object' && err !== null) {
        errorMessage = JSON.stringify(err, null, 2);
      }

      console.error('Checkout error:', {
        message: e.message,
        code: e.code,
        details: e.details,
        stack: e.stack,
      });

      setError(errorMessage);

      toast({
        title: 'Checkout Error',
        description: errorMessage,
        variant: 'destructive',
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
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            variant="outline"
            disabled={isSubmitting}
            onClick={() => {
              const message = `I just placed an order for ${
                items.length
              } items totaling ETB ${total.toFixed(2)}!`;
              const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
              window.open(url, '_blank');
            }}
          >
            <Share2 className="mr-2 h-4 w-4" />
            Share via WhatsApp
          </Button>
          <Button onClick={handleCheckout} disabled={isSubmitting}>
            {isSubmitting ? 'Processing...' : 'Confirm Order'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
