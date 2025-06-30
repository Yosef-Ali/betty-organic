'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { deleteOrder, getOrderDetails } from '@/app/actions/orderActions';
import { Profile } from '@/lib/types/auth';
import { createClient } from '@/lib/supabase/client';

interface OrderDetails {
  id: string;
  display_id?: string;
  createdAt: string;
  updatedAt?: string;
  profile: Profile;
  status?: string;
  type?: string;
  items: Array<{
    id: string;
    product: {
      name: string;
    };
    price: number;
    quantity: number;
  }>;
  total_amount: number;
  delivery_cost?: number;
  coupon_code?: string;
  discount_amount?: number;
  coupon?: {
    code: string;
    discount_amount: number;
    discount_type: 'percentage' | 'fixed';
  };
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
  // Store retryFetch in a ref to avoid dependency issues
  const retryFetchRef = useRef<() => void>(() => { });  // Function to retry loading order details
  const retryFetch = useCallback(() => {
    setRetryCount(prev => prev + 1);
    setError(null);
    setIsLoading(true);
  }, []);

  // Store the retryFetch function in a ref to keep it stable across renders
  useEffect(() => {
    retryFetchRef.current = retryFetch;
  }, [retryFetch]);

  useEffect(() => {
    let isMounted = true;
    let realtimeSubscription: any = null;

    // Set up Supabase realtime subscription for this specific order
    const setupRealtimeListener = async () => {
      if (!orderId) return;

      console.log(`[OrderDetails] Setting up realtime listener for order ID: ${orderId}`);
      const supabase = createClient();

      // Create a unique channel name to avoid conflicts
      const channelName = `order-details-${orderId}-${Date.now()}`;

      try {
        // Subscribe to changes for this specific order
        const channel = supabase
          .channel(channelName)
          .on(
            'postgres_changes',
            {
              event: '*', // Listen for all events (INSERT, UPDATE, DELETE)
              schema: 'public',
              table: 'orders',
              filter: `id=eq.${orderId}`, // Only listen for changes to this specific order
            },
            (payload) => {
              console.log(`[OrderDetails] Received order update for ID: ${orderId}`, payload);

              // Force a refresh of the order data
              if (isMounted) {
                console.log(`[OrderDetails] Refreshing order details after realtime update`);
                lastFetchedOrderIdRef.current = null; // Reset to force refresh
                retryFetchRef.current(); // Use the ref version for stability
              }
            }
          )
          .subscribe((status) => {
            console.log(`[OrderDetails] Realtime subscription status for order ${orderId}: ${status}`);
          });

        // Also listen for changes to order_items related to this order
        const itemsChannel = supabase
          .channel(`order-items-${orderId}-${Date.now()}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'order_items',
              filter: `order_id=eq.${orderId}`, // Only for items in this order
            },
            (payload) => {
              console.log(`[OrderDetails] Received order items update for order ID: ${orderId}`, payload);

              // Force a refresh of the order data
              if (isMounted) {
                console.log(`[OrderDetails] Refreshing order details after items update`);
                lastFetchedOrderIdRef.current = null; // Reset to force refresh
                retryFetchRef.current(); // Use the ref version for stability
              }
            }
          )
          .subscribe();

        realtimeSubscription = {
          orderChannel: channel,
          itemsChannel: itemsChannel,
          cleanup: () => {
            console.log(`[OrderDetails] Cleaning up realtime subscriptions for order ${orderId}`);
            supabase.removeChannel(channel);
            supabase.removeChannel(itemsChannel);
          }
        };
      } catch (err) {
        console.error(`[OrderDetails] Error setting up realtime subscription:`, err);
      }
    };

    // Initial setup
    setupRealtimeListener();

    // Skip if we already have the correct order loaded and it's not a retry
    if (order?.id === orderId && retryCount === 0) {
      setIsLoading(false);
      return;
    }

    // Skip fetching if we've already fetched this order ID recently (within 5 seconds)
    if (lastFetchedOrderIdRef.current === orderId) {
      const currentTime = Date.now();
      const lastFetchTime = Number(localStorage.getItem(`last_fetch_${orderId}`)) || 0;

      // If last fetch was within 5 seconds, skip this fetch
      if (currentTime - lastFetchTime < 5000) {
        console.log(`[OrderDetails] Skipping duplicate fetch for order ${orderId} - too soon`);
        setIsLoading(false);
        return;
      }
    }

    // Clear any existing timeout
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }

    // Set a delay to prevent rapid refetching - 300ms debounce
    fetchTimeoutRef.current = setTimeout(async () => {
      if (!isMounted) return;

      setIsLoading(true);
      setError(null);
      lastFetchedOrderIdRef.current = orderId;

      // Record fetch time in localStorage to prevent duplicate fetches across re-renders
      localStorage.setItem(`last_fetch_${orderId}`, Date.now().toString());

      try {
        console.log(`[OrderDetails] Fetching order details for ID: ${orderId}`);
        const startTime = Date.now();
        const { data, error } = await getOrderDetails(orderId);
        const endTime = Date.now();
        console.log(`[OrderDetails] Fetch completed in ${endTime - startTime}ms`);

        if (error) {
          console.error(`[OrderDetails] Error fetching order: ${error}`);
          throw error; // Throw the original error message string
        }

        if (!data) {
          console.error(`[OrderDetails] No data returned for order ID: ${orderId}`);
          throw new Error('Order not found');
        }

        // Transform the data to match our interface using real customer data
        const transformedOrder: OrderDetails = {
          id: data.id,
          display_id: data.display_id || '',
          createdAt: data.created_at || new Date().toISOString(), // Provide fallback for null
          updatedAt: data.updated_at || '',
          // Use real customer profile data
          profile: {
            id: data.customer?.id || 'default-id',
            name: data.customer?.name || 'Unknown Customer',
            email: data.customer?.email || 'No Email',
            role: (data.customer?.role as 'admin' | 'sales' | 'customer') || 'customer',
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            avatar_url: null,
            auth_provider: 'none',
            address: null,
            phone: data.customer?.phone || null,
          },
          items: Array.isArray(data.items) ? data.items.map(item => ({
            id: item.id || '',
            product: {
              name: item.product_name || 'Unknown Product',
            },
            price: item.price || 0,
            quantity: item.quantity || 0,
          })) : [],
          total_amount: data.total_amount || 0,
          delivery_cost: data.delivery_cost,
          coupon_code: data.coupon_code,
          discount_amount: data.discount_amount,
          coupon: data.coupon,
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

      // Clean up real-time subscriptions
      if (realtimeSubscription && realtimeSubscription.cleanup) {
        realtimeSubscription.cleanup();
      }
    };
  }, [orderId, retryCount]); // Remove order and retryFetch to prevent infinite loops

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
        router.push('/dashboard/orders'); // Use router.push for Next.js navigation
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
