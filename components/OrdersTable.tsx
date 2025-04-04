'use client';

import React, { useEffect } from 'react';
import { ExtendedOrder } from '@/types/order';
import { OrdersDataTable } from '@/components/orders/orders-data-table';
import { createClient } from '@/lib/supabase/client';

interface OrdersTableProps {
  orders: ExtendedOrder[];
  onSelectOrder: (id: string) => void;
  onDeleteOrder: (id: string) => Promise<void>;
  isLoading: boolean;
  connectionStatus?: string;
  onOrdersUpdated?: () => void; // New prop to handle orders refresh
  setConnectionStatus?: (status: string) => void; // New prop to update connection status
}

const OrdersTable: React.FC<OrdersTableProps> = ({
  orders,
  onSelectOrder,
  onDeleteOrder,
  isLoading,
  connectionStatus,
  onOrdersUpdated,
  setConnectionStatus,
}) => {
  // Setup real-time listener
  useEffect(() => {
    // Skip if we don't have the callback to refresh orders
    if (!onOrdersUpdated) return;

    const supabase = createClient();

    // Clear any existing listeners
    if (typeof localStorage !== 'undefined') {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('supabase.realtime')) {
          localStorage.removeItem(key);
        }
      });
    }

    // Create and subscribe to channel
    const channel = supabase
      .channel('orders-updates')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen for all events (insert, update, delete)
          schema: 'public',
          table: 'orders',
        },
        payload => {
          // When any order changes, refresh the orders list
          onOrdersUpdated();
        }
      )
      .subscribe(status => {
        // Update connection status if the setter is provided
        if (setConnectionStatus) {
          setConnectionStatus(status);
        }
      });

    // Cleanup function to remove the channel when component unmounts
    return () => {
      supabase.removeChannel(channel);
    };
  }, [onOrdersUpdated, setConnectionStatus]);

  return (
    <div className="space-y-4">
      {connectionStatus && connectionStatus !== 'SUBSCRIBED' && (
        <div className="bg-yellow-50 border border-yellow-100 rounded-md p-3 text-sm flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></span>
          <span className="text-yellow-700">Connecting to real-time updates...</span>
        </div>
      )}

      <OrdersDataTable
        orders={orders}
        onSelectOrder={onSelectOrder}
        onDeleteOrder={onDeleteOrder}
        isLoading={isLoading}
      />

      {orders.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No orders found</p>
        </div>
      )}
    </div>
  );
};

export default OrdersTable;
