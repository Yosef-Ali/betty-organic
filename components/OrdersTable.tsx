"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ExtendedOrder } from "@/types/order";
import { OrdersDataTable } from "@/components/orders/orders-data-table";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";

interface OrdersTableProps {
  orders: ExtendedOrder[];
  onSelectOrderAction: (id: string) => void;
  onDeleteOrder: (id: string) => Promise<void>;
  isLoading: boolean;
  connectionStatus?: string;
  onOrdersUpdated?: (options?: {
    silent?: boolean;
    showToast?: boolean;
  }) => Promise<void>; // Explicitly mark as Promise<void>
  setConnectionStatus?: (status: string) => void;
}

const OrdersTable: React.FC<OrdersTableProps> = ({
  orders,
  onSelectOrderAction,
  onDeleteOrder,
  isLoading,
  connectionStatus,
  onOrdersUpdated,
  setConnectionStatus,
}) => {
  const [logs, setLogs] = useState<string[]>([]);

  // Add a log function that's similar to the NotificationDebugger
  const addLog = useCallback((message: string) => {
    console.log(`[OrdersTable] ${message}`);
    setLogs((prev) => [...prev, `${new Date().toISOString()} - ${message}`]);
  }, []);

  // Main fetch function with silent option and minimal visual disruption
  const fetchOrders = useCallback(
    async (options: { silent?: boolean; showToast?: boolean } = {}) => {
      if (!onOrdersUpdated) return;

      const { silent = false, showToast = false } = options;

      addLog(`Fetching orders... ${silent ? "(silent)" : "(with UI update)"}`);
      try {
        // Call the parent component's update function with options
        await onOrdersUpdated({ silent, showToast });
        addLog(`Fetched ${orders.length} orders`);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        addLog(`Error: ${errorMessage}`);
      }
    },
    [onOrdersUpdated, orders.length, addLog]
  );

  // Enhanced realtime listener with better error handling and multiple table subscriptions
  const setupRealtimeListener = useCallback(() => {
    addLog("Setting up enhanced realtime listener...");
    const supabase = createClient();

    try {
      // Create unique channel names with timestamps to avoid conflicts
      const ordersChannelName = "orders-table-updates-" + Date.now();
      const orderItemsChannelName = "order-items-table-updates-" + Date.now();

      // Subscribe to orders table changes
      const ordersChannel = supabase
        .channel(ordersChannelName)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "orders",
          },
          (payload: {
            eventType: string;
            new: Record<string, any> | null;
            old: Record<string, any> | null;
          }) => {
            const eventType = payload.eventType;
            const orderId = payload.new?.id || payload.old?.id;
            addLog(`Received orders change: ${eventType} for order ${orderId}`);

            // Different handling based on event type
            switch (eventType) {
              case "INSERT":
                addLog(`New order created: ${orderId}`);
                break;
              case "UPDATE":
                addLog(`Order updated: ${orderId}`);
                break;
              case "DELETE":
                addLog(`Order deleted: ${orderId}`);
                break;
            }

            // Refresh orders data silently without visual indicators
            fetchOrders({ silent: true });
          }
        )
        .subscribe((status) => {
          if (setConnectionStatus) {
            setConnectionStatus(status);
          }
          addLog(`Orders subscription status: ${status}`);

          // Fetch initial data when subscription is established
          if (status === "SUBSCRIBED") {
            fetchOrders({ silent: true });
          }
        });

      // Also subscribe to order_items table for complete coverage
      const orderItemsChannel = supabase
        .channel(orderItemsChannelName)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "order_items",
          },
          (payload: {
            eventType: string;
            new: Record<string, any> | null;
            old: Record<string, any> | null;
          }) => {
            const eventType = payload.eventType;
            const itemId = payload.new
              ? payload.new.id
              : payload.old
              ? payload.old.id
              : "unknown";
            const orderId = payload.new
              ? payload.new.order_id
              : payload.old
              ? payload.old.order_id
              : "unknown";

            addLog(
              `Received order_items change: ${eventType} for item ${itemId} in order ${orderId}`
            );
            fetchOrders({ silent: true });
          }
        )
        .subscribe((status) => {
          addLog(`Order items subscription status: ${status}`);
        });

      // Poll very infrequently as a backup (significantly reduced frequency)
      const pollingInterval = setInterval(() => {
        addLog("Backup polling for orders updates");
        fetchOrders({ silent: true }); // Completely silent update for polling
      }, 300000); // Every 5 minutes instead of 30 seconds

      return () => {
        addLog("Cleaning up realtime subscriptions");
        try {
          supabase.removeChannel(ordersChannel);
          supabase.removeChannel(orderItemsChannel);
          clearInterval(pollingInterval);
        } catch (err) {
          console.warn("Error cleaning up channels:", err);
        }
      };
    } catch (err) {
      console.error("Error setting up realtime subscription:", err);
      addLog(
        `Error setting up realtime: ${
          err instanceof Error ? err.message : String(err)
        }`
      );

      // Return empty cleanup function in case of error
      return () => {};
    }
  }, [addLog, fetchOrders, setConnectionStatus]);

  // Initialize with minimal visual disruption
  useEffect(() => {
    // Initial fetch with visible loading state only for first load
    fetchOrders({ silent: false });

    // Setup realtime listener and store cleanup function
    const cleanup = setupRealtimeListener();

    // Cleanup on unmount
    return () => {
      if (typeof cleanup === "function") {
        cleanup();
      }
    };
  }, [fetchOrders, setupRealtimeListener]);

  return (
    <div className="space-y-4">
      {/* More subtle real-time indicator */}
      <div className="flex items-center mb-4 justify-end">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <div
            className={`h-2 w-2 rounded-full ${
              connectionStatus === "SUBSCRIBED"
                ? "bg-green-500"
                : "bg-yellow-500"
            }`}
          />
          <span>
            {connectionStatus === "SUBSCRIBED" ? "Live" : "Connecting..."}
          </span>
        </div>
      </div>

      <OrdersDataTable
        orders={orders}
        onSelectOrderAction={onSelectOrderAction}
        onDeleteOrderAction={onDeleteOrder}
        isLoading={isLoading}
        onOrdersUpdated={onOrdersUpdated}
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
              Click to {logs.length > 0 ? "view" : "hide"} activity log
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
