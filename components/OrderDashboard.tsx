// OrderDashboard.tsx
"use client";

import React, { useEffect, useMemo, useCallback, useState, useRef } from "react";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { File } from "lucide-react";
import { OrdersOverviewCard } from "./OrdersOverviewCard";
import { StatCard } from "./StatCard";
import {
  getOrders,
  deleteOrder,
  getOrderById,
} from "../app/actions/orderActions";
import { getCustomers } from "../app/actions/profile";
import { useToast } from "../hooks/use-toast";
import OrderTable from "./OrdersTable";
import type { Order, OrderItem, ExtendedOrder } from "@/types/order";
import OrderDetailsCard from "./OrderDetailsCard";
import { supabase, getRealtimeStatus } from "@/lib/supabase";
import { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js";

interface OrderPayload {
  id: string;
  [key: string]: any;
}

// Type guard to check if an object is an OrderPayload
function isOrderPayload(obj: any): obj is OrderPayload {
  return (
    obj && typeof obj === "object" && "id" in obj && typeof obj.id === "string"
  );
}

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
  const [connectionStatus, setConnectionStatus] =
    useState<string>("CONNECTING");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const subscriptionRetryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [realtimeEnabled, setRealtimeEnabled] = useState<boolean>(true);
  const [retryCount, setRetryCount] = useState(0);
  const [lastRefreshTime, setLastRefreshTime] = useState<number>(Date.now());
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Function to convert a single raw order from DB/payload to the Order type used in UI
  const processSingleOrder = useCallback(
    (orderData: any, customerList: any[]): ExtendedOrder => {
      const orderAny = orderData as any;
      const customerFromList = orderAny.customer_profile_id
        ? customerList.find((c) => c.id === orderAny.customer_profile_id)
        : null;

      const fallbackCustomer = {
        id: "unknown",
        name: "Unknown Customer",
        email: "N/A",
        phone: null,
        role: "customer",
      };

      let customerDetails = fallbackCustomer;
      if (customerFromList) {
        customerDetails = {
          id: customerFromList.id,
          name: customerFromList.fullName || customerFromList.name || null,
          email: customerFromList.email,
          phone: customerFromList.phone || null,
          role: "customer",
        };
      } else if (orderAny.customer) {
        customerDetails = {
          id: orderAny.customer.id || "unknown",
          name: orderAny.customer.fullName || orderAny.customer.name || null,
          email: orderAny.customer.email || "N/A",
          phone: orderAny.customer.phone || null,
          role: "customer",
        };
      }

      const orderItems = (orderAny.order_items || []).map(
        (item: any): OrderItem => ({
          id: item.id || "",
          product_id: item.product_id,
          product_name:
            item.product_name || item.products?.name || "Unknown Product",
          quantity: item.quantity || 0,
          price: item.price || 0,
          order_id: item.order_id || orderAny.id,
          product: item.products
            ? { name: item.products.name || "Unknown Product" }
            : undefined,
        })
      );

      return {
        id: orderAny.id ?? "",
        display_id: orderAny.display_id,
        status: orderAny.status ?? "pending",
        type: (orderAny.type as OrderType) ?? "SALE",
        total_amount: orderAny.total_amount ?? 0,
        created_at: orderAny.created_at ?? new Date().toISOString(),
        updated_at: orderAny.updated_at,
        profile_id: orderAny.profile_id ?? "",
        customer_profile_id: orderAny.customer_profile_id ?? "",
        order_items: orderItems,
        items: orderItems,
        customer: customerDetails,
        profiles: orderAny.seller
          ? {
            id: orderAny.seller.id,
            name: orderAny.seller.name || "",
            email: orderAny.seller.email,
            role: orderAny.seller.role,
            phone: orderAny.seller.phone ?? null,
            avatar_url: orderAny.seller.avatar_url ?? null,
          }
          : undefined,
      };
    },
    []
  );

  const processMultipleOrders = useCallback(
    (ordersData: any[], customerList: any[]): ExtendedOrder[] => {
      return ordersData.map((order) => processSingleOrder(order, customerList));
    },
    [processSingleOrder]
  );

  const loadData = useCallback(
    async (
      options?: {
        silent?: boolean;
        isInitial?: boolean;
        showToast?: boolean;
      },
      payload?: RealtimePostgresChangesPayload<Order>
    ) => {
      const {
        silent = false,
        isInitial = false,
        showToast = false,
      } = options || {};

      const now = Date.now();
      const timeSinceLastRefresh = now - lastRefreshTime;
      const MIN_REFRESH_INTERVAL = 1500;

      const bypassThrottle = isInitial || !!payload || !silent;

      if (!bypassThrottle && timeSinceLastRefresh < MIN_REFRESH_INTERVAL) {
        console.log(
          `[OrderDashboard] Skipping refresh - too soon (${timeSinceLastRefresh}ms since last refresh)`
        );
        return;
      }

      if (payload) {
        console.log(
          "[OrderDashboard RT] loadData triggered by Realtime event:",
          payload.eventType,
          (payload.new as Order)?.id || (payload.old as Order)?.id
        );
      }

      if (isInitial) {
        setIsLoading(true);
      } else if (!silent) {
        console.log("[OrderDashboard Manual] loadData triggered manually.");
      }

      setLastRefreshTime(now);

      let newOrderId: string | null = null;
      if (
        payload &&
        payload.eventType === "INSERT" &&
        ((payload.table === "orders") ||
          (payload.schema === "public" && payload.table === "orders")) &&
        (payload.new as Order)?.id
      ) {
        newOrderId = (payload.new as Order).id;
        console.log(
          `[OrderDashboard RT] New order detected via payload: ${newOrderId}`
        );
      } else if (payload && payload.eventType === "DELETE") {
        const oldId = (payload.old as Order)?.id;
        console.log(
          `[OrderDashboard RT] Order deletion detected via payload: ${oldId}`
        );
        if (selectedOrderId && oldId === selectedOrderId) {
          console.log(
            `[OrderDashboard RT] Currently selected order ${selectedOrderId} was deleted. Clearing selection.`
          );
          setSelectedOrderId(null);
        }
      } else if (payload && payload.eventType === "UPDATE") {
        const updatedId = (payload.new as Partial<Order>)?.id;
        console.log(
          `[OrderDashboard RT] Order update detected via payload: ${updatedId}`
        );
      }

      try {
        const customersResponse = await getCustomers();
        const customersData = Array.isArray(customersResponse)
          ? customersResponse
          : [];
        setCustomers(customersData);

        console.log("[OrderDashboard Fetch] Fetching orders...");
        const ordersResponse = await getOrders();
        if (!ordersResponse) {
          throw new Error("Failed to fetch orders");
        }
        const ordersData = Array.isArray(ordersResponse) ? ordersResponse : [];
        console.log(
          `[OrderDashboard Fetch] Fetched ${ordersData.length} orders.`
        );
        if (payload) {
          const newOrderInFetch = ordersData.find((o) => o.id === newOrderId);
          if (newOrderId && newOrderInFetch) {
            console.log(
              `[OrderDashboard RT] Newly inserted order ${newOrderId} IS present in fetched data.`
            );
          } else if (newOrderId && !newOrderInFetch) {
            console.warn(
              `[OrderDashboard RT] Newly inserted order ${newOrderId} was NOT found in fetched data immediately after event.`
            );
          }
        }

        const processedOrders = processMultipleOrders(
          ordersData,
          customersData
        );

        const sortedOrders = processedOrders.sort(
          (a, b) =>
            new Date(b.created_at ?? 0).getTime() -
            new Date(a.created_at ?? 0).getTime()
        );

        const currentOrders = orders;

        const ordersChanged =
          JSON.stringify(sortedOrders) !== JSON.stringify(currentOrders);

        console.log(
          `[OrderDashboard Compare] Orders changed: ${ordersChanged}. New count: ${sortedOrders.length}, Old count: ${currentOrders.length}`
        );
        if (!ordersChanged && payload) {
          console.log(
            "[OrderDashboard Compare] Data fetched but string comparison shows no change. Current state:",
            currentOrders
          );
          console.log(
            "[OrderDashboard Compare] Data fetched but string comparison shows no change. Fetched/Sorted state:",
            sortedOrders
          );
        }

        const forceUpdateDueToInsert =
          payload?.eventType === "INSERT" && newOrderId;

        if (ordersChanged || forceUpdateDueToInsert) {
          if (forceUpdateDueToInsert && !ordersChanged) {
            console.warn(
              "[OrderDashboard Update] Forcing state update due to INSERT event, despite string comparison showing no change."
            );
          }
          console.log(
            `[OrderDashboard Update] Orders state WILL be updated. New count: ${sortedOrders.length}`
          );
          setOrders(sortedOrders);

          if (newOrderId) {
            console.log(
              `[OrderDashboard Select] Selecting newly inserted order: ${newOrderId}`
            );
            setSelectedOrderId(newOrderId);
          } else if (payload?.eventType === "DELETE") {
            const oldId = (payload.old as Order)?.id;
            if (selectedOrderId && oldId === selectedOrderId) {
              console.log(
                `[OrderDashboard Select] Clearing selection for deleted order ${selectedOrderId}`
              );
              setSelectedOrderId(null);
              if (sortedOrders.length > 0) {
                console.log(
                  `[OrderDashboard Select] Selecting first available order after deletion: ${sortedOrders[0].id}`
                );
                setSelectedOrderId(sortedOrders[0].id);
              }
            } else if (!selectedOrderId && sortedOrders.length > 0) {
              console.log(
                `[OrderDashboard Select] Selecting first available order after deletion (nothing was selected before): ${sortedOrders[0].id}`
              );
              setSelectedOrderId(sortedOrders[0].id);
            }
          } else if (sortedOrders.length > 0 && !selectedOrderId) {
            console.log(
              `[OrderDashboard Select] Nothing selected, selecting first order: ${sortedOrders[0].id}`
            );
            setSelectedOrderId(sortedOrders[0].id);
          } else if (selectedOrderId) {
            const currentSelectedOrderExists = sortedOrders.some(
              (o) => o.id === selectedOrderId
            );
            if (!currentSelectedOrderExists) {
              console.log(
                `[OrderDashboard Select] Previously selected order ${selectedOrderId} no longer exists. Selecting first available.`
              );
              setSelectedOrderId(
                sortedOrders.length > 0 ? sortedOrders[0].id : null
              );
            } else {
              console.log(
                `[OrderDashboard Select] Previously selected order ${selectedOrderId} still exists. Keeping selection.`
              );
            }
          } else if (sortedOrders.length === 0) {
            console.log(
              "[OrderDashboard Select] No orders left. Clearing selection."
            );
            setSelectedOrderId(null);
          }

          if (!silent && !isInitial && showToast) {
            toast({
              title: "Orders Updated",
              description: `${sortedOrders.length} orders loaded`,
              duration: 3000,
            });
          }
        } else {
          console.log(
            "[OrderDashboard Update] No changes detected based on comparison and not a forced insert. State will NOT be updated."
          );
          if (
            newOrderId &&
            sortedOrders.find((o) => o.id === newOrderId) &&
            selectedOrderId !== newOrderId
          ) {
            console.log(
              `[OrderDashboard Select Edge Case] Selecting new order ${newOrderId} even though comparison showed no change.`
            );
            setSelectedOrderId(newOrderId);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Failed to fetch data";

        toast({
          title: "Error",
          description: `${errorMessage}. Please try again.`,
          variant: "destructive",
          duration: 7000,
        });

        setOrders([]);
        setCustomers([]);
        setSelectedOrderId(null);
      } finally {
        setIsLoading(false);
        if (payload) {
          console.log(
            "[OrderDashboard RT] loadData finished processing Realtime event."
          );
        }
      }
    },
    [processMultipleOrders, toast, selectedOrderId, orders, lastRefreshTime]
  );

  const loadDataRef = useRef<typeof loadData | null>(null);

  useEffect(() => {
    loadDataRef.current = loadData;
  }, [loadData]);

  // Create a stable function wrapper to pass down
  // This function's identity will not change across renders
  const handleOrdersUpdated = useCallback(
    async (
      options?: { silent?: boolean; showToast?: boolean },
      payload?: RealtimePostgresChangesPayload<Order>
    ) => {
      // Always call the *latest* version of loadData via the ref
      if (loadDataRef.current) {
        await loadDataRef.current(options, payload);
      }
    },
    [] // Empty dependency array ensures this function is stable
  );

  useEffect(() => {
    const checkAndSetupRefresh = async () => {
      try {
        const isEnabled = await getRealtimeStatus();
        console.log(`[OrderDashboard] Realtime enabled check: ${isEnabled}`);
        setRealtimeEnabled(isEnabled);

        if (pollTimerRef.current) {
          clearInterval(pollTimerRef.current);
          pollTimerRef.current = null;
        }

        const pollInterval = isEnabled ? 20000 : 10000;
        console.log(
          `[OrderDashboard] Setting up ${isEnabled ? "backup" : "primary"} polling with interval: ${pollInterval}ms`
        );

        pollTimerRef.current = setInterval(() => {
          console.log(
            `[OrderDashboard] Performing ${isEnabled ? "backup" : "primary"} poll check`
          );
          if (loadDataRef.current) {
            loadDataRef.current({ silent: true });
          }
        }, pollInterval);
      } catch (err) {
        console.error("[OrderDashboard] Error checking realtime status:", err);

        if (pollTimerRef.current) {
          clearInterval(pollTimerRef.current);
        }

        pollTimerRef.current = setInterval(() => {
          console.log("[OrderDashboard] Performing fallback poll check (after error)");
          if (loadDataRef.current) {
            loadDataRef.current({ silent: true });
          }
        }, 15000);
      }
    };

    if (loadDataRef.current) {
      loadDataRef.current({ isInitial: true });
    }

    checkAndSetupRefresh();

    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (realtimeEnabled === false) {
      console.log("[OrderDashboard] Skipping Realtime setup as it's not enabled");
      return;
    }

    let ordersChannel: RealtimeChannel | null = null;

    const setupSubscription = () => {
      try {
        if (retryCount >= 3) {
          console.log(
            "[OrderDashboard] Giving up on Realtime after 3 retries, using polling instead"
          );
          return;
        }

        if (subscriptionRetryTimeoutRef.current) {
          clearTimeout(subscriptionRetryTimeoutRef.current);
          subscriptionRetryTimeoutRef.current = null;
        }

        console.log(
          "[OrderDashboard] Setting up Supabase Realtime subscription for orders..."
        );
        setConnectionStatus("CONNECTING");

        const channelName = `public:orders:${Date.now()}`;
        console.log(`[OrderDashboard] Creating channel: ${channelName}`);

        ordersChannel = supabase
          .channel(channelName)
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "orders" },
            (payload: RealtimePostgresChangesPayload<Order>) => {
              console.log("[OrderDashboard] Realtime change received:", payload);
              if (loadDataRef.current) {
                loadDataRef.current({ silent: true }, payload);
              }
            }
          )
          .subscribe((status: string, err?: Error) => {
            console.log(
              `[OrderDashboard] Supabase Realtime status: ${status}`,
              err ? `| Error: ${err.message}` : ""
            );

            if (status === "SUBSCRIBED") {
              setConnectionStatus("CONNECTED");
              setIsSubscribed(true);
              setRetryCount(0);
            } else if (
              status === "CHANNEL_ERROR" ||
              status === "TIMED_OUT" ||
              status === "CLOSED"
            ) {
              setConnectionStatus("DISCONNECTED");
              setIsSubscribed(false);

              console.log(
                "[OrderDashboard] Realtime connection closed or errored, relying on polling instead"
              );
              setRetryCount((prev) => prev + 1);
            }
          });
      } catch (setupError) {
        console.error("[OrderDashboard] Error during subscription setup:", setupError);
        setConnectionStatus("ERROR");
      }
    };

    if (realtimeEnabled) {
      setupSubscription();
    }

    return () => {
      if (ordersChannel) {
        try {
          console.log("[OrderDashboard] Cleaning up Realtime subscription on unmount");
          supabase
            .removeChannel(ordersChannel)
            .catch((err) => {
              console.log("[OrderDashboard] Non-critical error removing channel:", err);
            });
        } catch (e) {
          console.log(
            "[OrderDashboard] Exception during channel cleanup (non-critical):",
            e
          );
        }
        ordersChannel = null;
      }
    };
  }, [realtimeEnabled, retryCount]);

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

  const getStartOfWeek = useCallback((date: Date): Date => {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
  }, []);

  const getStartOfLastWeek = useCallback((): Date => {
    const date = getStartOfWeek(new Date());
    date.setDate(date.getDate() - 7);
    return date;
  }, [getStartOfWeek]);

  const getStartOfMonth = useCallback((date: Date): Date => {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }, []);

  const getStartOfLastMonth = useCallback((): Date => {
    const date = new Date();
    return new Date(date.getFullYear(), date.getMonth() - 1, 1);
  }, []);

  const {
    currentWeekTotal,
    lastWeekTotal,
    currentWeekChangePercentage,
    currentMonthTotal,
    lastMonthTotal,
    currentMonthChangePercentage,
  } = useMemo(() => {
    const startOfCurrentWeek = getStartOfWeek(new Date());
    const startOfLastWeek = getStartOfLastWeek();
    const startOfCurrentMonth = getStartOfMonth(new Date());
    const startOfLastMonth = getStartOfLastMonth();

    const computeTotal = (startDate: Date, endDate: Date) => {
      return orders
        .filter((order) => {
          const orderDate = new Date(order.created_at ?? 0);
          return orderDate >= startDate && orderDate < endDate;
        })
        .reduce((sum, order) => sum + (order.total_amount || 0), 0);
    };

    const currentWeekTotal = computeTotal(startOfCurrentWeek, new Date());
    const lastWeekTotal = computeTotal(startOfLastWeek, startOfCurrentWeek);
    const currentWeekChangePercentage = lastWeekTotal
      ? ((currentWeekTotal - lastWeekTotal) / lastWeekTotal) * 100
      : 100;

    const currentMonthTotal = computeTotal(startOfCurrentMonth, new Date());
    const lastMonthTotal = computeTotal(startOfLastMonth, startOfCurrentMonth);
    const currentMonthChangePercentage = lastMonthTotal
      ? ((currentMonthTotal - lastMonthTotal) / lastMonthTotal) * 100
      : 100;

    return {
      currentWeekTotal,
      lastWeekTotal,
      currentWeekChangePercentage,
      currentMonthTotal,
      lastMonthTotal,
      currentMonthChangePercentage,
    };
  }, [
    orders,
    getStartOfWeek,
    getStartOfLastWeek,
    getStartOfMonth,
    getStartOfLastMonth,
  ]);

  return (
    <main className="grid flex-1 items-start gap-4 px-0 sm:px-6 sm:py-0 md:gap-8 lg:grid-cols-3 xl:grid-cols-3">
      <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
        <div className="grid gap-4 px-4 sm:px-0 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
          <OrdersOverviewCard />
          <StatCard
            title="This Week"
            value={`Br ${currentWeekTotal.toFixed(2)}`}
            change={`${currentWeekChangePercentage >= 0 ? "+" : ""
              }${currentWeekChangePercentage.toFixed(2)}% from last week`}
            changePercentage={currentWeekChangePercentage}
          />
          <StatCard
            title="This Month"
            value={`Br ${currentMonthTotal.toFixed(2)}`}
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
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1"
                onClick={() => loadData({ silent: false, showToast: true })}
                disabled={isLoading}
              >
                <svg
                  className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`}
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
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                  Refresh
                </span>
              </Button>

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
              key="week-orders"
              orders={orders}
              onSelectOrderAction={setSelectedOrderId}
              onDeleteOrder={handleDelete}
              isLoading={isLoading}
              connectionStatus={connectionStatus}
              onOrdersUpdated={handleOrdersUpdated} // Pass the stable wrapper function
              setConnectionStatus={setConnectionStatus}
            />
          </TabsContent>
          <TabsContent value="month">
            <OrderTable
              key="month-orders"
              orders={orders}
              onSelectOrderAction={setSelectedOrderId}
              onDeleteOrder={handleDelete}
              isLoading={isLoading}
              connectionStatus={connectionStatus}
              onOrdersUpdated={handleOrdersUpdated} // Pass the stable wrapper function
              setConnectionStatus={setConnectionStatus}
            />
          </TabsContent>
        </Tabs>
      </div>
      {selectedOrderId && <OrderDetailsCard orderId={selectedOrderId} />}
    </main>
  );
};

export default OrderDashboard;
