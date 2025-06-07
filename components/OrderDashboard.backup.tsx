// OrderDashboard.tsx
"use client";

import React, {
  useEffect,
  useCallback,
  useState,
  useRef,
} from "react";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { File } from "lucide-react";
import { OrdersOverviewCard } from "./OrdersOverviewCard";
import { StatCard } from "./StatCard";
import {
  getOrders,
  deleteOrder,
} from "../app/actions/orderActions";
import { getCustomers } from "../app/actions/profile";
import { useToast } from "../hooks/use-toast";
import OrderTable from "./OrdersTable";
import type { ExtendedOrder } from "@/types/order";
import OrderDetailsCard from "./OrderDetailsCard";
import { formatOrderCurrency, formatCompactCurrency } from "@/lib/utils";
import { useOrderStats } from "@/hooks/orders/useOrderStats";
import { useRealtime } from "@/lib/supabase/realtime-provider";
import { processMultipleOrders } from "@/utils/orders/orderProcessing";


export const OrderType = {
  SALE: "sale",
  REFUND: "refund",
  CREDIT: "credit",
} as const;

export type OrderType = (typeof OrderType)[keyof typeof OrderType];

const OrderDashboard: React.FC = () => {
  const [orders, setOrders] = useState<ExtendedOrder[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const { toast } = useToast();
  const { subscribeToOrders } = useRealtime();  // Handle realtime order updates
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchTimeRef = useRef<number>(0);
  const handleOrderUpdate = useCallback((order: any, event: 'INSERT' | 'UPDATE' | 'DELETE') => {
    console.log('[OrderDashboard] 📋 Received real-time event:', {
      event,
      orderId: order.id,
      status: order.status,
      currentOrdersLength: orders.length
    });
    
    if (event === 'INSERT') {
      console.log('[OrderDashboard] 🆕 Processing INSERT event');
      setOrders(prev => {
        console.log('[OrderDashboard] 📊 Current orders count before INSERT:', prev.length);
        // Process the new order to match our ExtendedOrder format
        const processedOrder = {
          ...order,
          order_items: order.order_items || [],
          customer: customers.find(c => c.id === order.customer_profile_id) || null
        } as ExtendedOrder;

        const newOrders = [processedOrder, ...prev];
        console.log('[OrderDashboard] 📊 New orders count after INSERT:', newOrders.length);
        // Always select the newest order when it comes in
        setSelectedOrderId(order.id);
        console.log('[OrderDashboard] ✅ INSERT completed, new selected order:', order.id);
        return newOrders;
      });
    } else if (event === 'UPDATE') {
      console.log('[OrderDashboard] 🔄 Processing UPDATE event');
      setOrders(prev => {
        const updated = prev.map(existingOrder =>
          existingOrder.id === order.id
            ? { ...existingOrder, ...order }
            : existingOrder
        );
        console.log('[OrderDashboard] ✅ UPDATE completed for order:', order.id);
        return updated;
      });
    } else if (event === 'DELETE') {
      console.log('[OrderDashboard] 🗑️ Processing DELETE event');
      setOrders(prev => {
        const filtered = prev.filter(existingOrder => existingOrder.id !== order.id);
        setSelectedOrderId(current => current === order.id ? (filtered.length > 0 ? filtered[0].id : null) : current);
        console.log('[OrderDashboard] ✅ DELETE completed, orders count:', filtered.length);
        return filtered;
      });
    }
  }, [customers, orders.length]); // Removed selectedOrderId dependency

  // Simple initial data fetch - memoized to prevent infinite re-runs
  const fetchInitialData = useCallback(async () => {
    // Debounce to prevent excessive calls
    const now = Date.now();
    if (now - lastFetchTimeRef.current < 1000) { // 1 second debounce
      console.log(`[OrderDashboard] Skipping fetchInitialData - debounce active`);
      return;
    }
    lastFetchTimeRef.current = now;

    try {
      const callId = Math.random().toString(36).substr(2, 9);
      console.log(`[OrderDashboard] fetchInitialData called - Call ID: ${callId}`);

      // Fetch customers and orders in parallel
      const [customersResponse, ordersResponse] = await Promise.all([
        getCustomers().catch(() => []),
        getOrders(undefined, 'OrderDashboard').catch(() => [])
      ]);

      const customersData = Array.isArray(customersResponse) ? customersResponse : [];
      const ordersData = Array.isArray(ordersResponse) ? ordersResponse : [];

      setCustomers(customersData);

      // Process orders if we have valid data
      let processedOrders: ExtendedOrder[] = [];
      if (ordersData.length > 0) {
        processedOrders = processMultipleOrders(ordersData, customersData);
      }

      const sortedOrders = processedOrders.sort(
        (a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
      );

      setOrders(sortedOrders);

      // Always select the most recent order (first in sorted list)
      if (sortedOrders.length > 0) {
        setSelectedOrderId(sortedOrders[0].id);
      }

    } catch (error) {
      console.error("Error fetching initial data:", error);
      // Use toast function but don't make it a dependency to avoid re-renders
      if (toast) {
        toast({
          title: "Error Loading Data",
          description: "Failed to load orders. Please try again.",
          variant: "destructive",
          duration: 5000,
        });
      }
      setOrders([]);
      setCustomers([]);
      setSelectedOrderId(null);
    }
  }, []); // Empty dependency array to prevent re-creation



  // Subscribe to realtime updates and initial data load - Fixed dependency issues
  useEffect(() => {
    const effectId = Math.random().toString(36).substr(2, 9);
    console.log(`[OrderDashboard] Main useEffect running - Effect ID: ${effectId}`);

    const unsubscribe = subscribeToOrders(handleOrderUpdate);
    fetchInitialData();

    return () => {
      console.log(`[OrderDashboard] Cleaning up effect ${effectId}`);
      unsubscribe();
    };
  }, []); // Empty dependency array - callbacks are stable now

  const handleDelete = async (id: string) => {
    try {
      const result = await deleteOrder(id);
      if (!result.success) {
        const errorMessage =
          typeof result.error === "string"
            ? result.error
            : "Failed to delete order server-side";
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error("Error initiating order deletion:", error);
      toast({
        title: "Error",
        description: `Failed to initiate order deletion: ${error instanceof Error ? error.message : "Unknown error"
          }`,
        variant: "destructive",
        important: true,
      });
    }
  };


  // Use the custom hook for stats calculation
  const {
    currentWeekTotal,
    lastWeekTotal,
    currentWeekChangePercentage,
    currentMonthTotal,
    lastMonthTotal,
    currentMonthChangePercentage,
  } = useOrderStats(orders);

  return (
    <main className="grid flex-1 items-start gap-4 px-0 sm:px-6 sm:py-0 md:gap-8 lg:grid-cols-3 xl:grid-cols-3">
      <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
        <div className="grid gap-4 px-4 sm:px-0 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
          <OrdersOverviewCard />
          <StatCard
            title="This Week"
            value={formatCompactCurrency(currentWeekTotal)}
            change={`${currentWeekChangePercentage >= 0 ? "+" : ""
              }${currentWeekChangePercentage.toFixed(2)}% from last week`}
            changePercentage={currentWeekChangePercentage}
          />
          <StatCard
            title="This Month"
            value={formatCompactCurrency(currentMonthTotal)}
            change={`${currentMonthChangePercentage >= 0 ? "+" : ""
              }${currentMonthChangePercentage.toFixed(2)}% from last month`}
            changePercentage={currentMonthChangePercentage}
          />
        </div>
        <Tabs defaultValue="week" className="px-4 sm:px-0">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <TabsList className="mr-2">
                <TabsTrigger value="week">This Week</TabsTrigger>
                <TabsTrigger value="month">This Month</TabsTrigger>
              </TabsList>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-8 gap-1">
                <File className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                  Export
                </span>
              </Button>
            </div>
          </div>
          <TabsContent value="week">
            <OrderTable
              orders={orders}
              onSelectOrderAction={setSelectedOrderId}
              onDeleteOrder={handleDelete}
            />
          </TabsContent>
          <TabsContent value="month">
            <OrderTable
              orders={orders}
              onSelectOrderAction={setSelectedOrderId}
              onDeleteOrder={handleDelete}
            />
          </TabsContent>
        </Tabs>
      </div>
      {selectedOrderId && orders.length > 0 && <OrderDetailsCard orderId={selectedOrderId} />}
    </main>
  );
};

export default OrderDashboard;
