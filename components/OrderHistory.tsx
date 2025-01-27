'use client';

import { useState, useEffect } from 'react';
import { Package, PackageOpen, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getOrders } from '@/app/actions/orderActions';
import { Database } from '@/types/supabase';

type Order = Database['public']['Tables']['orders']['Row'] & {
  order_items: Array<
    Database['public']['Tables']['order_items']['Row'] & {
      products: Database['public']['Tables']['products']['Row'];
    }
  >;
};

interface OrderHistoryProps {
  userId: string;
}

export function OrderHistory({ userId }: OrderHistoryProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const orders = await getOrders(userId);
      setOrders(orders || []);
    } catch (error) {
      console.error('Error in fetchOrders:', error);
      setMessage('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div
            key={i}
            className="flex items-center space-x-4 p-4 border rounded-lg"
          >
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-[200px]" />
              <Skeleton className="h-4 w-[150px]" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (message) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-md">
        <p className="text-sm">{message}</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 p-8">
        <PackageOpen className="w-12 h-12 text-muted-foreground" />
        <p className="text-muted-foreground">No orders found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map(order => (
        <div
          key={order.id}
          className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center">
              <Package className="w-6 h-6 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">Order #{order.id.slice(0, 8)}</p>
              <p className="text-sm text-muted-foreground">
                {order.created_at &&
                  new Date(order.created_at).toLocaleDateString()}
              </p>
              <p className="text-sm text-muted-foreground">Order Items:</p>
              <ul className="list-disc list-inside">
                {order.order_items.map((item, index) => (
                  <li key={index}>
                    {item.products.name} - Quantity: {item.quantity} - Price: $
                    {item.price.toFixed(2)}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="font-medium">${order.total_amount.toFixed(2)}</p>
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    order.status === 'completed'
                      ? 'bg-green-500'
                      : order.status === 'pending'
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`}
                />
                <p className="text-sm text-muted-foreground capitalize">
                  {order.status}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
