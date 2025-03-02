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

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

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
    <div className="space-y-2 sm:space-y-4">
      {orders.map(order => (
        <div
          key={order.id}
          className="flex flex-col gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors sm:flex-row sm:items-center sm:gap-6 sm:p-6"
        >
          {/* Order Info */}
          <div className="flex items-start gap-4 sm:w-[200px]">
            <div className="flex items-center justify-center w-10 h-10 rounded-md shrink-0 bg-muted">
              <Package className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="font-medium text-sm sm:text-base">#{order.id.slice(0, 8)}</p>
              <time className="text-xs text-muted-foreground sm:text-sm">
                {order.created_at && new Date(order.created_at).toLocaleDateString()}
              </time>
            </div>
          </div>

          {/* Items List */}
          <div className="flex-1 min-w-0">
            <div className="space-y-2">
              {order.order_items.map((item, index) => (
                <div key={index} className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate">{item.products.name}</span>
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <span>{item.quantity} × Br {item.price.toFixed(2)}</span>
                    <span className="hidden text-muted-foreground sm:inline">
                      (Br {(item.quantity * item.price).toFixed(2)})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Status & Total */}
          <div className="flex items-center justify-between gap-4 pt-4 mt-4 border-t sm:flex-col sm:items-end sm:w-[180px] sm:border-0 sm:pt-0 sm:mt-0">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${order.status === 'completed' ? 'bg-green-500' :
                order.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                }`} />
              <span className="text-sm capitalize">{order.status}</span>
            </div>
            <div className="flex items-center gap-2">
              <p className="font-medium text-sm sm:text-base">
                Br {order.total_amount.toFixed(2)}
              </p>
              {/* <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
          <ChevronRight className="w-4 h-4" />
          <span className="sr-only">View order details</span>
        </Button> */}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
