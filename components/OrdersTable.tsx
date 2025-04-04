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

  // Setup realtime listener - exactly like NotificationDebugger
  const setupRealtimeListener = () => {
    addLog('Setting up realtime listener...');
    const supabase = createClient();

    // Clear any existing listeners
    if (typeof localStorage !== 'undefined') {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('supabase.realtime')) {
          localStorage.removeItem(key);
        }
      });
    }

    const channel = supabase
      .channel('orders-table-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        payload => {
          addLog(`Received postgres_changes: ${payload.eventType}`);
          fetchOrders();
        },
      )
      .subscribe(status => {
        if (setConnectionStatus) {
          setConnectionStatus(status);
        }
        addLog(`Subscription status: ${status}`);
      });

    // Poll every 5 seconds as a backup
    const pollingInterval = setInterval(() => {
      addLog('Polling for orders updates');
      fetchOrders();
    }, 5000);

    return () => {
      addLog('Cleaning up realtime subscription');
      supabase.removeChannel(channel);
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
          <h3 className="font-medium">Connection:</h3>
          <Badge
            variant={
              connectionStatus === 'SUBSCRIBED' ? 'default' : 'destructive'
            }
          >
            {connectionStatus || 'Not connected'}
          </Badge>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchOrders}
          disabled={isLoading}
        >
          Refresh Orders
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

      {/* Debug logs (hidden by default, can be enabled for debugging) */}
      {logs.length > 0 && (
        <div className="mt-4">
          <details>
            <summary className="cursor-pointer text-sm text-muted-foreground">
              Debug logs ({logs.length})
            </summary>
            <div className="bg-muted p-2 rounded-md h-40 overflow-y-auto text-xs font-mono mt-2">
              {logs.map((log, index) => (
                <div key={index} className="py-1">
                  {log}
                </div>
              ))}
            </div>
          </details>
        </div>
      )}
    </div>
  );
};

export default OrdersTable;
