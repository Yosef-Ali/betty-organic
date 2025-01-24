'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { deleteOrder, getOrderDetails } from '@/app/actions/orderActions';

interface OrderDetails {
  id: string;
  createdAt: string;
  updatedAt?: string;
  profile: {
    full_name: string;
    email: string;
    role: string;
  };
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

        // Transform the data to match our interface
        const transformedOrder: OrderDetails = {
          id: data.id,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
          profile: {
            full_name: data.profile.full_name,
            email: data.profile.email,
            role: data.profile.role,
          },
          items: data.order_items.map(item => ({
            id: item.id,
            product: {
              name: item.product.name,
            },
            price: item.price,
            quantity: item.quantity,
          })),
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
