"use client";

import React, { useEffect, useCallback } from "react";
import { ExtendedOrder } from "@/types/order";
import { OrdersDataTable } from "@/components/orders/orders-data-table";
import { createClient } from "@/lib/supabase/client";

interface OrdersTableProps {
  orders: ExtendedOrder[];
  onSelectOrderAction: (id: string) => void;
  onDeleteOrder: (id: string) => Promise<void>;
  isLoading: boolean;
  connectionStatus?: string;
  onOrdersUpdated?: (
    options?: {
      silent?: boolean;
      showToast?: boolean;
    },
    payload?: any // Add optional payload parameter
  ) => Promise<void>;
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
  // Keeping console logs for debugging but removing UI logs
  const addLog = useCallback((message: string) => {
    console.log(`[OrdersTable] ${message}`);
  }, []);

  // Main fetch function with silent option and minimal visual disruption
  const fetchOrders = useCallback(
    async (
      options: { silent?: boolean; showToast?: boolean } = {},
      payload?: any // Accept optional payload
    ) => {
      if (!onOrdersUpdated) return;

      const { silent = false, showToast = false } = options;

      addLog(`Fetching orders... ${silent ? "(silent)" : "(with UI update)"}`);
      try {
        // Call the parent component's update function with options and payload
        await onOrdersUpdated({ silent, showToast }, payload); // Pass payload
        // Don't reference orders.length here as it creates a dependency cycle
        addLog(`Orders fetch completed`);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        addLog(`Error: ${errorMessage}`);
      }
    },
    [onOrdersUpdated, addLog] // Removed orders.length dependency
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
          (payload: any) => {
            const eventType = payload.eventType;
            const orderId = payload.new?.id || payload.old?.id;
            addLog(`Received orders change: ${eventType} for order ${orderId}`);

            // Log the full payload for debugging
            console.log('[OrdersTable] Full payload received:', JSON.stringify(payload, null, 2));

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

            // Refresh orders data, passing the payload
            fetchOrders({ silent: true }, payload); // Pass payload here
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
          (payload: any) => {
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
            // Refresh orders data, passing the payload for potential handling
            fetchOrders({ silent: true }, payload); // Pass payload here
          }
        )
        .subscribe((status) => {
          addLog(`Order items subscription status: ${status}`);
        });

      // Removed backup polling for orders updates

      return () => {
        addLog("Cleaning up realtime subscriptions");
        try {
          supabase.removeChannel(ordersChannel);
          supabase.removeChannel(orderItemsChannel);
          // Removed clearInterval for pollingInterval
        } catch (err) {
          console.warn("Error cleaning up channels:", err);
        }
      };
    } catch (err) {
      console.error("Error setting up realtime subscription:", err);
      addLog(
        `Error setting up realtime: ${err instanceof Error ? err.message : String(err)
        }`
      );

      // Return empty cleanup function in case of error
      return () => { };
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
            className={`h-2 w-2 rounded-full ${connectionStatus === "SUBSCRIBED"
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
