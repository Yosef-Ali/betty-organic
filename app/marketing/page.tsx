'use client';

import { useEffect } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useMarketingCartStore } from '@/store/cartStore';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { handlePurchaseOrder } from '@/app/actions/purchaseActions';

// ... rest of your imports

export default function MarketingPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Check for pending order in session storage
    const pendingOrderStr = sessionStorage.getItem('pendingOrder');
    if (pendingOrderStr && user) {
      try {
        const pendingOrder = JSON.parse(pendingOrderStr);
        // Remove the pending order from session storage
        sessionStorage.removeItem('pendingOrder');

        // Process the pending order
        handlePurchaseOrder(pendingOrder.items, pendingOrder.total)
          .then((result) => {
            if (result.data) {
              toast.success('Order created successfully!');
              // Clear the cart and redirect to orders page
              useMarketingCartStore.getState().clearCart();
              router.push('/dashboard/orders');
            } else {
              throw new Error(result.error || 'Failed to create order');
            }
          })
          .catch((error) => {
            console.error('Error processing pending order:', error);
            toast.error('Failed to process your order. Please try again.');
          });
      } catch (error) {
        console.error('Error parsing pending order:', error);
        sessionStorage.removeItem('pendingOrder');
      }
    }
  }, [user, router]);

  // ... rest of your component code
}
