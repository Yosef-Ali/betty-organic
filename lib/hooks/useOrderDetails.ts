'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { deleteOrder, getOrderDetails } from '@/app/actions/orderActions';
import { Profile } from '@/lib/types/auth';

interface OrderDetails {
  id: string;
  display_id?: string;
  createdAt: string;
  updatedAt?: string;
  profile: Profile;
  items: Array<{
    id: string;
    product: {
      name: string;
    };
    price: number;
    quantity: number;
  }>;
  total_amount: number;
}

// Helper function to check if object is an error with message
function hasErrorMessage(obj: any): obj is { message: string } {
  return obj && typeof obj === 'object' && 'message' in obj && typeof obj.message === 'string';
}

export function useOrderDetails(orderId: string) {
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [error, setError] = useState<{
    message: string;
    isAuth?: boolean;
  } | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const router = useRouter();

  // Add a ref to track the last fetched order ID to avoid duplicate fetches
  const lastFetchedOrderIdRef = useRef<string | null>(null);
  // Add a ref to prevent multiple fetches in rapid succession
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Function to retry loading order details
  const retryFetch = useCallback(() => {
    setRetryCount(prev => prev + 1);
    setError(null);
    setIsLoading(true);
  }, []);

  useEffect(() => {
    let isMounted = true;

    // If we're already fetching this order ID or it's the same as the last one, don't fetch again
    if (lastFetchedOrderIdRef.current === orderId && order !== null) {
      return;
    }

    // Clear any existing timeout
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }

    // Set a small delay to prevent rapid refetching
    fetchTimeoutRef.current = setTimeout(async () => {
      if (!isMounted) return;

      setIsLoading(true);
      setError(null);
      lastFetchedOrderIdRef.current = orderId;

      try {
        console.log(`[OrderDetails] Fetching order details for ID: ${orderId}`);
        const startTime = Date.now();
        const { data, error } = await getOrderDetails(orderId);
        const endTime = Date.now();
        console.log(`[OrderDetails] Fetch completed in ${endTime - startTime}ms`);

        if (error) {
          console.error(`[OrderDetails] Error fetching order: ${error}`);
          throw new Error(error);
        }

        if (!data) {
          console.error(`[OrderDetails] No data returned for order ID: ${orderId}`);
          throw new Error('Order not found');
        }

        // Create a default profile if needed
        const defaultProfile: Profile = {
          id: 'default-id',
          name: 'Unknown Customer',
          email: 'No Email',
          role: 'customer',
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          avatar_url: null,
          auth_provider: 'none',
        };

        // Transform the data to match our interface
        const transformedOrder: OrderDetails = {
          id: data.id,
          display_id: data.display_id || '',
          createdAt: data.created_at,
          updatedAt: data.updated_at || '',
          profile: data.customer || defaultProfile,
          items: Array.isArray(data.items) ? data.items.map(item => ({
            id: item.id || '',
            product: {
              name: item.product_name || 'Unknown Product',
            },
            price: item.price || 0,
            quantity: item.quantity || 0,
          })) : [],
          total_amount: data.total_amount || 0,
        };

        if (isMounted) {
          console.log(`[OrderDetails] Setting order data for ID: ${orderId}`);
          setOrder(transformedOrder);
        }
      } catch (err: any) {
        if (isMounted) {
          const errorMessage = hasErrorMessage(err) ? err.message : 'Failed to load order details';
          const isAuthError = hasErrorMessage(err) && (
            err.message.includes('JWT expired') ||
            err.message.includes('Authentication required')
          );

          console.error(`[OrderDetails] Error: ${errorMessage}`);
          setError({
            message: errorMessage,
            isAuth: isAuthError,
          });
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
          fetchTimeoutRef.current = null;
        }
      }
    }, 300); // Add a 300ms debounce to prevent rapid refetching

    // Cleanup function
    return () => {
      isMounted = false;
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, [orderId, retryCount]); // Removed router dependency since it's not used in the effect

  // Function to handle manual retry
  const handleRetry = useCallback(() => {
    console.log(`[OrderDetails] Retrying fetch for order ID: ${orderId}`);
    lastFetchedOrderIdRef.current = null; // Reset the last fetched ID to force a refresh
    retryFetch();
  }, [retryFetch, orderId]);

  const handleConfirmDelete = async () => {
    try {
      const result = await deleteOrder(orderId);
      if (result.success) {
        setIsDialogOpen(false);
        window.location.href = '/dashboard/orders';
      } else {
        console.error('Error deleting order:', result.error);
      }
    } catch (err) {
      console.error('Error deleting order:', err);
    }
  };

  return {
    order,
    error,
    isLoading,
    isDialogOpen,
    setIsDialogOpen,
    handleConfirmDelete,
    handleRetry,
    retryCount,
  };
}
