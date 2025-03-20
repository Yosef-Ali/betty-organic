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
  total_amount: number;
}

// Define type for SelectQueryError
interface SelectQueryError {
  code: string;
  message: string;
}

// Define OrderData interface to type the response from API
interface OrderData {
  id: string;
  display_id?: string;
  created_at: string;
  updated_at?: string;
  profile?: Profile;
  customer?: Profile;
  order_items?: Array<{
    id: string;
    product?: { name: string };
    product_name?: string;
    price: number;
    quantity: number;
  }>;
  total_amount?: number;
}

// Helper function to check if an object is a SelectQueryError
function isSelectQueryError(obj: any): obj is SelectQueryError {
  return obj && typeof obj === 'object' && 'code' in obj && 'message' in obj;
}

// Helper function to check if object is an error with message
function hasErrorMessage(obj: any): obj is { message: string } {
  return obj && typeof obj === 'object' && 'message' in obj && typeof obj.message === 'string';
}

// Helper function to check if object is OrderData
function isOrderData(obj: any): obj is OrderData {
  return obj && typeof obj === 'object' && 'id' in obj;
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
          if (hasErrorMessage(error) && error.message.includes('permission denied')) {
            throw new Error('You do not have permission to view this order');
          }
          if (hasErrorMessage(error) && error.message.includes('JWT expired')) {
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
          auth_provider: 'none',
        };

        // Check if data is a SelectQueryError and throw early
        if (isSelectQueryError(data)) {
          console.error('Query error in fetchOrderDetails:', data.message);
          throw new Error(`Database error: ${data.message}`);
        }

        // Check if data is valid OrderData
        if (!isOrderData(data)) {
          throw new Error('Invalid order data structure received');
        }

        // At this point, TypeScript knows data is OrderData
        const orderData = data;

        // Transform the data to match our interface
        const transformedOrder: OrderDetails = {
          id: orderData.id,
          display_id: orderData.display_id,
          createdAt: orderData.created_at,
          updatedAt: orderData.updated_at,
          // Safely access profile or customer properties
          profile: orderData.profile || orderData.customer || defaultProfile,
          items: Array.isArray(orderData.order_items)
            ? orderData.order_items.map(item => ({
              id: item.id,
              product: {
                name: item.product?.name || item.product_name || 'Unknown Product',
              },
              price: item.price,
              quantity: item.quantity,
            }))
            : [],
          total_amount: orderData.total_amount || 0,
        };

        setOrder(transformedOrder);
      } catch (err: any) {
        const errorMessage = hasErrorMessage(err) ? err.message : 'Failed to load order details';
        const isAuthError = hasErrorMessage(err) && (
          err.message.includes('JWT expired') ||
          err.message.includes('Authentication required')
        );

        setError({
          message: errorMessage,
          isAuth: isAuthError,
        });
      }
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
    } catch (err) {
      console.error('Error deleting order:', err);
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
