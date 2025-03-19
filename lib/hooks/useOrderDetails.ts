'use client';

import { useState, useEffect } from 'react';
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
}

export function useOrderDetails(orderId: string) {
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [error, setError] = useState<{
    message: string;
    isAuth?: boolean;
  } | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function fetchOrderDetails() {
      try {
        const { data, error } = await getOrderDetails(orderId);

        if (error) {
          if (error.message?.includes('permission denied')) {
            throw new Error('You do not have permission to view this order');
          }
          if (error.message?.includes('JWT expired')) {
            router.push('/auth/signin');
            return;
          }
          throw error;
        }

        if (!data) {
          throw new Error('Order not found');
        }

        // Create default profile if data.profile is missing
        const defaultProfile: Profile = {
          id: 'temp-id',
          name: 'Unknown Customer',
          email: 'No Email',
          role: 'customer',
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          avatar_url: null,
        };

        // Check if data is a SelectQueryError
        if ('code' in data && 'message' in data) {
          console.error('Query error in fetchOrderDetails:', data.message);
          throw new Error(`Database error: ${data.message}`);
        }

        // Transform the data to match our interface
        const transformedOrder: OrderDetails = {
          id: data.id,
          display_id: data.display_id,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
          // Safely access profile or customer properties only if data is not an error object
          profile: isSelectQueryError(data)
            ? defaultProfile
            : (data.profile || data.customer || defaultProfile),
          items: Array.isArray(data.order_items) ? data.order_items.map(item => ({
            id: item.id,
            product: {
              name: item.product?.name || item.product_name || 'Unknown Product',
            },
            price: item.price,
            quantity: item.quantity,
          })) : [],
        };

        setOrder(transformedOrder);
      } catch (error: any) {
        const isAuthError =
          error.message?.includes('JWT expired') ||
          error.message?.includes('Authentication required');
        setError({
          message: error.message || 'Failed to load order details',
          isAuth: isAuthError,
        });
      }
    }

    // Helper function to check if an object is a SelectQueryError
    function isSelectQueryError(obj: any): boolean {
      return obj && typeof obj === 'object' && 'code' in obj && 'message' in obj;
    }

    fetchOrderDetails();
  }, [orderId, router]);

  const handleConfirmDelete = async () => {
    try {
      const result = await deleteOrder(orderId);
      if (result.success) {
        setIsDialogOpen(false);
        window.location.href = '/dashboard/orders';
      } else {
        console.error('Error deleting order:', result.error);
      }
    } catch (error) {
      console.error('Error deleting order:', error);
    }
  };

  return {
    order,
    error,
    isDialogOpen,
    setIsDialogOpen,
    handleConfirmDelete,
  };
}
