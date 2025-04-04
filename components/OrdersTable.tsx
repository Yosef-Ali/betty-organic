'use client';

import React, { useState, useEffect } from 'react';
import { ExtendedOrder } from '@/types/order';
import { OrdersDataTable } from '@/components/orders/orders-data-table';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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
  const [logs, setLogs] = useState<string[]>([]);

  // Add a log function that's similar to the NotificationDebugger
  const addLog = (message: string) => {
    console.log(`[OrdersTable] ${message}`);
    setLogs(prev => [...prev, `${new Date().toISOString()} - ${message}`]);
  };

  // Main fetch function - similar pattern to NotificationDebugger
  const fetchOrders = async () => {
    if (!onOrdersUpdated) return;

    addLog('Fetching orders...');
    try {
      // Call the parent component's update function
      await onOrdersUpdated();
      addLog(`Fetched ${orders.length} orders`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      addLog(`Error: ${errorMessage}`);
    }
  };

  // Enhanced realtime listener with better error handling and multiple table subscriptions
  const setupRealtimeListener = () => {
    addLog('Setting up enhanced realtime listener...');
    const supabase = createClient();

    // Clear any existing listeners to prevent duplicates
    if (typeof localStorage !== 'undefined') {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('supabase.realtime')) {
          localStorage.removeItem(key);
        }
      });
    }

    // Subscribe to orders table changes
    const ordersChannel = supabase
      .channel('orders-table-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        payload => {
          const eventType = payload.eventType;
          const orderId = payload.new?.id || payload.old?.id;
          addLog(`Received orders change: ${eventType} for order ${orderId}`);

          // Different handling based on event type
          switch (eventType) {
            case 'INSERT':
              addLog(`New order created: ${orderId}`);
              break;
            case 'UPDATE':
              addLog(`Order updated: ${orderId}`);
              break;
            case 'DELETE':
              addLog(`Order deleted: ${orderId}`);
              break;
          }

          // Refresh orders data
          fetchOrders();
        },
      )
      .subscribe(status => {
        if (setConnectionStatus) {
          setConnectionStatus(status);
        }
        addLog(`Orders subscription status: ${status}`);
      });

    // Also subscribe to order_items table for complete coverage
    const orderItemsChannel = supabase
      .channel('order-items-table-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'order_items',
        },
        payload => {
          const eventType = payload.eventType;
          const itemId = payload.new?.id || payload.old?.id;
          const orderId = payload.new?.order_id || payload.old?.order_id;

          addLog(
            `Received order_items change: ${eventType} for item ${itemId} in order ${orderId}`,
          );
          fetchOrders();
        },
      )
      .subscribe(status => {
        addLog(`Order items subscription status: ${status}`);
      });

    // Poll every 30 seconds as a backup (reduced frequency to avoid unnecessary requests)
    const pollingInterval = setInterval(() => {
      addLog('Backup polling for orders updates');
      fetchOrders();
    }, 30000);

    return () => {
      addLog('Cleaning up realtime subscriptions');
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(orderItemsChannel);
      clearInterval(pollingInterval);
    };
  };

  // Initialize just like NotificationDebugger
  useEffect(() => {
    fetchOrders();
    const cleanup = setupRealtimeListener();
    return cleanup;
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="font-medium">Realtime:</h3>
          <Badge
            variant={
              connectionStatus === 'SUBSCRIBED' ? 'success' : 'destructive'
            }
            className={
              connectionStatus === 'SUBSCRIBED'
                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                : ''
            }
          >
            {connectionStatus === 'SUBSCRIBED'
              ? 'Connected'
              : connectionStatus || 'Not connected'}
          </Badge>

          {connectionStatus === 'SUBSCRIBED' && (
            <span className="text-xs text-muted-foreground ml-2">
              Updates will appear automatically
            </span>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchOrders}
          disabled={isLoading}
          className="flex items-center gap-1"
        >
          <svg
            className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          Refresh
        </Button>
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

      {/* Debug logs with improved UI */}
      <div className="mt-4 border rounded-md overflow-hidden">
        <details>
          <summary className="cursor-pointer p-2 bg-muted flex items-center justify-between hover:bg-muted/80 transition-colors">
            <div className="flex items-center gap-2">
              <span className="font-medium">Realtime Activity</span>
              <Badge variant="outline" className="ml-2">
                {logs.length} events
              </Badge>
            </div>
            <span className="text-xs text-muted-foreground">
              Click to {logs.length > 0 ? 'view' : 'hide'} activity log
            </span>
          </summary>
          <div className="bg-muted/30 p-2 max-h-60 overflow-y-auto text-xs font-mono">
            {logs.length > 0 ? (
              logs.map((log, index) => (
                <div
                  key={index}
                  className="py-1 border-b border-muted last:border-0"
                >
                  {log}
                </div>
              ))
            ) : (
              <div className="py-4 text-center text-muted-foreground">
                No activity recorded yet
              </div>
            )}
          </div>
        </details>
      </div>
    </div>
  );
};

export default OrdersTable;
