'use client';

import React, { useEffect, useState } from 'react';
import { ExtendedOrder } from '@/types/order';
import { OrdersDataTable } from '@/components/orders/orders-data-table';
import { createClient } from '@/lib/supabase/client';

interface OrdersTableProps {
  orders: ExtendedOrder[];
  onSelectOrder: (id: string) => void;
  onDeleteOrder: (id: string) => Promise<void>;
  isLoading: boolean;
  connectionStatus?: string;
  onOrdersUpdated?: () => void; // Callback to refresh orders
  setConnectionStatus?: (status: string) => void; // Update connection status
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
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [pollingEnabled, setPollingEnabled] = useState(true);

  // Setup more aggressive polling like the NotificationDebugger
  useEffect(() => {
    // Skip if we don't have the callback to refresh orders
    if (!onOrdersUpdated || !pollingEnabled) return;

    console.log('Starting aggressive order polling...');

    // Initial fetch
    onOrdersUpdated();

    // Very frequent polling (5 seconds)
    const frequentPolling = setInterval(() => {
      console.log('Polling orders table for updates');
      onOrdersUpdated();
      setLastRefresh(new Date());
    }, 5000); // Poll every 5 seconds

    return () => {
      console.log('Stopping order polling');
      clearInterval(frequentPolling);
    };
  }, [onOrdersUpdated, pollingEnabled]);

  // Setup real-time listener (as a backup to polling)
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
          console.log(`Received real-time order change: ${payload.eventType}`, payload);
          onOrdersUpdated();
          setLastRefresh(new Date());
        }
      )
      .subscribe(status => {
        // Update connection status if the setter is provided
        if (setConnectionStatus) {
          console.log(`Orders subscription status: ${status}`);
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

      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          {lastRefresh && `Last updated: ${lastRefresh.toLocaleTimeString()}`}
        </div>
        <div className="flex gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={pollingEnabled}
              onChange={(e) => setPollingEnabled(e.target.checked)}
              className="rounded"
            />
            Auto-refresh
          </label>
          {onOrdersUpdated && (
            <button
              onClick={() => {
                console.log('Manual refresh triggered');
                onOrdersUpdated();
                setLastRefresh(new Date());
              }}
              className="text-sm text-blue-600 hover:underline"
            >
              Refresh Now
            </button>
          )}
        </div>
      </div>

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
