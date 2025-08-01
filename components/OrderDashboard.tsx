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
import { getUser } from "../app/actions/auth";
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
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const { toast } = useToast();
  const { subscribeToOrders } = useRealtime();
  // Refs for managing state updates
  const customersRef = useRef<any[]>([]);
  const mountedRef = useRef(true);

  // Update customers ref when state changes
  useEffect(() => {
    customersRef.current = customers;
  }, [customers]);

  // Handle realtime order updates with stable callback
  const handleOrderUpdate = useCallback((order: any, event: 'INSERT' | 'UPDATE' | 'DELETE') => {
    if (!mountedRef.current) return;

    console.log('[OrderDashboard] Received real-time event:', {
      event,
      orderId: order.id,
      status: order.status,
      mounted: mountedRef.current
    });

    if (event === 'INSERT') {
      setOrders(prev => {
        // Check if order already exists to prevent duplicates
        const existingOrder = prev.find(o => o.id === order.id);
        if (existingOrder) {
          console.log('[OrderDashboard] Order already exists, skipping insert');
          return prev;
        }

        // Process the new order with current customers
        let customer = null;
        if (!order.is_guest_order) {
          customer = customersRef.current.find(c => c.id === order.customer_profile_id) || null;
        }
        
        const processedOrder = {
          ...order,
          order_items: order.order_items || [],
          customer
        } as ExtendedOrder;

        const newOrders = [processedOrder, ...prev];

        // Auto-select the new order
        setSelectedOrderId(order.id);

        return newOrders;
      });

      // Show toast notification for new orders
      toast({
        title: "New Order Received",
        description: `Order ${order.display_id || order.id.slice(0, 8)} has been created`,
        duration: 5000,
      });

    } else if (event === 'UPDATE') {
      setOrders(prev =>
        prev.map(existingOrder =>
          existingOrder.id === order.id
            ? { ...existingOrder, ...order, customer: existingOrder.customer }
            : existingOrder
        )
      );

      // Show update notification only for status changes
      if (order.status) {
        toast({
          title: "Order Updated",
          description: `Order ${order.display_id || order.id.slice(0, 8)} status changed to ${order.status}`,
          duration: 3000,
        });
      }
    } else if (event === 'DELETE') {
      setOrders(prev => {
        const filtered = prev.filter(existingOrder => existingOrder.id !== order.id);

        // If deleted order was selected, select another
        if (selectedOrderId === order.id && filtered.length > 0) {
          setSelectedOrderId(filtered[0].id);
        } else if (filtered.length === 0) {
          setSelectedOrderId(null);
        }

        return filtered;
      });

      toast({
        title: "Order Deleted",
        description: `Order ${order.display_id || order.id.slice(0, 8)} has been removed`,
        duration: 3000,
      });
    }
  }, [toast, selectedOrderId]);


  // Fetch initial data
  const fetchInitialData = useCallback(async () => {
    if (!mountedRef.current) return;

    try {
      setIsLoading(true);

      // Fetch user data, customers and orders in parallel
      const [userResponse, customersResponse, ordersResponse] = await Promise.all([
        getUser().catch(() => null),
        getCustomers().catch(() => []),
        getOrders(undefined, 'OrderDashboard').catch(() => [])
      ]);

      // Set user role
      if (userResponse?.profile?.role) {
        setUserRole(userResponse.profile.role);
      }

      if (!mountedRef.current) return;

      const customersData = Array.isArray(customersResponse) ? customersResponse : [];
      const ordersData = Array.isArray(ordersResponse) ? ordersResponse : [];

      setCustomers(customersData);
      customersRef.current = customersData;

      // Process orders
      let processedOrders: ExtendedOrder[] = [];
      if (ordersData.length > 0) {
        processedOrders = processMultipleOrders(ordersData, customersData);
      }

      const sortedOrders = processedOrders.sort(
        (a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
      );

      setOrders(sortedOrders);

      // Select the most recent order
      if (sortedOrders.length > 0 && !selectedOrderId) {
        setSelectedOrderId(sortedOrders[0].id);
      }
    } catch (error) {
      console.error("Error fetching initial data:", error);
      if (mountedRef.current) {
        toast({
          title: "Error Loading Data",
          description: "Failed to load orders. Please refresh the page.",
          variant: "destructive",
          duration: 5000,
        });
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [toast, selectedOrderId]);

  // Setup realtime subscription
  useEffect(() => {
    mountedRef.current = true;

    // Subscribe to realtime updates
    const unsubscribe = subscribeToOrders(handleOrderUpdate);

    return () => {
      mountedRef.current = false;
      unsubscribe();
    };
  }, [subscribeToOrders]); // Only depend on subscribeToOrders to prevent re-subscription loops

  // Fetch initial data separately to avoid dependency issues
  useEffect(() => {
    fetchInitialData();
  }, []); // Run only once on mount

  // Handle order deletion
  const handleDelete = async (id: string) => {
    try {
      const result = await deleteOrder(id);
      if (!result.success) {
        throw new Error(result.error || "Failed to delete order");
      }
      // Real-time update will handle the UI update
    } catch (error) {
      console.error("Error deleting order:", error);
      toast({
        title: "Error",
        description: `Failed to delete order: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
        duration: 5000,
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

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading orders...</div>
      </div>
    );
  }

  return (
    <main className="flex-1 space-y-3 p-3 sm:space-y-4 sm:p-4 lg:p-6">
      {/* Stats Cards - Mobile Friendly Grid */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <OrdersOverviewCard />
        <StatCard
          title="This Week"
          value={formatCompactCurrency(currentWeekTotal)}
          change={`${currentWeekChangePercentage >= 0 ? "+" : ""}${currentWeekChangePercentage.toFixed(2)}% from last week`}
          changePercentage={currentWeekChangePercentage}
        />
        <StatCard
          title="This Month"
          value={formatCompactCurrency(currentMonthTotal)}
          change={`${currentMonthChangePercentage >= 0 ? "+" : ""}${currentMonthChangePercentage.toFixed(2)}% from last month`}
          changePercentage={currentMonthChangePercentage}
        />
      </div>

      {/* Mobile: Order Details at Top */}
      {selectedOrderId && orders.length > 0 && (
        <div className="lg:hidden">
          <OrderDetailsCard orderId={selectedOrderId} />
        </div>
      )}

      {/* Orders Table Section */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-3 sm:space-y-4">
          <Tabs defaultValue="week" className="space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
                <TabsList className="self-start w-fit">
                  <TabsTrigger value="week" className="text-xs sm:text-sm px-2 sm:px-3">
                    This Week
                  </TabsTrigger>
                  <TabsTrigger value="month" className="text-xs sm:text-sm px-2 sm:px-3">
                    This Month
                  </TabsTrigger>
                </TabsList>
                <div className="text-xs sm:text-sm text-muted-foreground">
                  {orders.length} total orders
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="h-8 gap-1 text-xs sm:text-sm px-2 sm:px-3">
                  <File className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Export</span>
                  <span className="sm:hidden">Export</span>
                </Button>
              </div>
            </div>
            <TabsContent value="week" className="space-y-0">
              <OrderTable
                orders={orders}
                onSelectOrderAction={setSelectedOrderId}
                onDeleteOrder={handleDelete}
                userRole={userRole || undefined}
              />
            </TabsContent>
            <TabsContent value="month" className="space-y-0">
              <OrderTable
                orders={orders}
                onSelectOrderAction={setSelectedOrderId}
                onDeleteOrder={handleDelete}
                userRole={userRole || undefined}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Desktop: Order Details Sidebar */}
        {selectedOrderId && orders.length > 0 && (
          <div className="hidden lg:block">
            <OrderDetailsCard orderId={selectedOrderId} />
          </div>
        )}
      </div>
    </main>
  );
};

export default OrderDashboard;