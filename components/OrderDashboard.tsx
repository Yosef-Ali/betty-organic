// OrderDashboard.tsx
'use client';

import React, { useEffect, useMemo, useCallback, useState } from 'react';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { File } from 'lucide-react';
import { OrdersOverviewCard } from './OrdersOverviewCard';
import { StatCard } from './StatCard';
import OrderDetails from './OrderDetailsCard';
// Assume getOrderById exists, will be created later
import {
  getOrders,
  deleteOrder,
  getOrderById,
} from '../app/actions/orderActions';
import { getCustomers } from '../app/actions/profile';
import { useToast } from '../hooks/use-toast';
import OrderTable from './OrdersTable';
import type { Order, OrderItem } from '@/types/order'; // Removed CustomerProfile import
import { createClient } from '@/lib/supabase/client';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

interface OrderPayload {
  id: string;
  [key: string]: any;
}

// Type guard to check if an object is an OrderPayload
function isOrderPayload(obj: any): obj is OrderPayload {
  return (
    obj && typeof obj === 'object' && 'id' in obj && typeof obj.id === 'string'
  );
}

export const OrderType = {
  SALE: 'sale',
  REFUND: 'refund',
  CREDIT: 'credit',
} as const;

export type OrderType = (typeof OrderType)[keyof typeof OrderType];

const OrderDashboard: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] =
    useState<string>('Not connected');
  const [logs, setLogs] = useState<string[]>([]);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();
  const supabase = createClient();

  // Add debug logging function
  const addLog = (message: string) => {
    console.log(`[OrderDashboard] ${message}`);
    setLogs(prev => [...prev, `${new Date().toISOString()} - ${message}`]);
  };

  // Function to convert a single raw order from DB/payload to the Order type used in UI
  const processSingleOrder = useCallback(
    (orderData: any, customerList: any[]): Order => {
      const orderAny = orderData as any;
      const customerFromList = orderAny.customer_profile_id
        ? customerList.find(c => c.id === orderAny.customer_profile_id)
        : null;

      // Fallback customer structure
      const fallbackCustomer = {
        id: 'unknown',
        name: 'Unknown Customer',
        email: 'N/A',
        phone: null,
        role: 'customer',
      };

      // Determine customer details
      let customerDetails = fallbackCustomer;
      if (customerFromList) {
        customerDetails = {
          id: customerFromList.id,
          name: customerFromList.fullName || customerFromList.name || null, // Check multiple possible name fields
          email: customerFromList.email,
          phone: customerFromList.phone || null,
          role: 'customer', // Assuming role is always customer here
        };
      } else if (orderAny.customer) {
        // If customer data is directly embedded (e.g., from getOrderById)
        customerDetails = {
          id: orderAny.customer.id || 'unknown',
          name: orderAny.customer.fullName || orderAny.customer.name || null,
          email: orderAny.customer.email || 'N/A',
          phone: orderAny.customer.phone || null,
          role: 'customer',
        };
      }

      return {
        id: orderAny.id,
        display_id: orderAny.display_id || undefined,
        status: orderAny.status,
        type: orderAny.type as OrderType,
        total_amount: orderAny.total_amount || 0,
        created_at: orderAny.created_at,
        updated_at: orderAny.updated_at || undefined,
        profile_id: orderAny.profile_id || null,
        customer_profile_id: orderAny.customer_profile_id || null,
        order_items: orderAny.order_items || [], // Ensure order_items are included if available
        customer: customerDetails,
        // Map items if available, ensure structure matches OrderItem
        items: (orderAny.order_items || []).map(
          (item: any): OrderItem => ({
            id: item.id,
            product_id: item.product_id,
            product_name:
              item.product_name || item.product?.name || 'Unknown Product', // Get name from item or nested product
            quantity: item.quantity,
            price: item.price,
            // Corrected: Only include properties expected by the type (assuming just 'name')
            product: item.product ? { name: item.product.name } : undefined,
          }),
        ),
      };
    },
    [],
  );

  // Function to convert multiple database orders
  const processMultipleOrders = useCallback(
    (ordersData: any[], customerList: any[]): Order[] => {
      return ordersData.map(order => processSingleOrder(order, customerList));
    },
    [processSingleOrder],
  );

  // Enhanced function to load data with minimal visual disruption
  const loadData = useCallback(
    async (options?: {
      silent?: boolean;
      isInitial?: boolean;
      showToast?: boolean;
    }) => {
      const {
        silent = false,
        isInitial = false,
        showToast = false,
      } = options || {};

      // Only show loading state for initial loads or explicit manual refreshes
      if (isInitial) {
        // For initial load, show loading indicator
        setIsLoading(true);
      } else if (!silent) {
        // For manual refresh, show a subtle updating indicator
        setIsUpdating(true);
      }
      // For real-time updates (silent=true), don't show any loading indicators

      try {
        // Fetch customers first or in parallel
        const customersResponse = await getCustomers();
        const customersData = Array.isArray(customersResponse)
          ? customersResponse
          : [];
        setCustomers(customersData); // Store customers in state

        // Fetch orders
        const ordersResponse = await getOrders();
        if (!ordersResponse) {
          throw new Error('Failed to fetch orders');
        }
        const ordersData = Array.isArray(ordersResponse) ? ordersResponse : [];

        // Process orders using the stored customer list
        const processedOrders = processMultipleOrders(
          ordersData,
          customersData,
        );

        const sortedOrders = processedOrders.sort(
          (a, b) =>
            new Date(b.created_at ?? 0).getTime() -
            new Date(a.created_at ?? 0).getTime(),
        );

        // Check if orders have changed before updating state
        const ordersChanged =
          JSON.stringify(sortedOrders) !== JSON.stringify(orders);

        if (ordersChanged) {
          addLog(`Orders updated: ${sortedOrders.length} orders loaded`);
          setOrders(sortedOrders);
          setLastUpdateTime(new Date()); // Record the update time

          // Only show toast for explicit manual refresh button clicks
          if (!silent && !isInitial && showToast) {
            toast({
              title: 'Orders Updated',
              description: `${sortedOrders.length} orders loaded`,
              duration: 3000,
            });
          }
        } else {
          addLog('No changes detected in orders data');
        }

        // Set initial selection only if no order is currently selected
        if (sortedOrders.length > 0 && !selectedOrderId) {
          setSelectedOrderId(sortedOrders[0].id);
        } else if (sortedOrders.length === 0) {
          setSelectedOrderId(null); // Clear selection if no orders
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to fetch data';

        // Always show errors, even in silent mode
        toast({
          title: 'Error',
          description: `${errorMessage}. Please try again.`,
          variant: 'destructive',
          // Mark error toasts as important so they require manual dismissal
          important: true,
        });

        setOrders([]);
        setCustomers([]); // Clear customers on error too
        setSelectedOrderId(null); // Clear selection on error
      } finally {
        // Always turn off loading states
        setIsLoading(false);
        setIsUpdating(false);
      }
    },
    [processMultipleOrders, toast, selectedOrderId, orders],
  ); // Add orders as dependency

  // Enhanced Supabase real-time subscriptions with minimal visual disruption
  useEffect(() => {
    // Load initial data with initial flag set to true
    loadData({ isInitial: true });
    addLog('Setting up realtime listeners...');

    // Clear any existing listeners to prevent duplicates
    if (typeof localStorage !== 'undefined') {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('supabase.realtime')) {
          localStorage.removeItem(key);
        }
      });
    }

    const supabaseClient = createClient();

    // Subscribe to changes on the orders table with enhanced handling
    const ordersChannel = supabaseClient
      .channel('orders-dashboard')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        async (payload: RealtimePostgresChangesPayload<OrderPayload>) => {
          const eventType = payload.eventType;
          const orderId = isOrderPayload(payload.new)
            ? payload.new.id
            : isOrderPayload(payload.old)
            ? payload.old.id
            : undefined;
          const displayId =
            (payload.new &&
            typeof payload.new === 'object' &&
            'display_id' in payload.new
              ? payload.new.display_id
              : undefined) ||
            (payload.old &&
            typeof payload.old === 'object' &&
            'display_id' in payload.old
              ? payload.old.display_id
              : undefined) ||
            (orderId ? orderId.slice(0, 8) : 'unknown');

          addLog(
            `Orders change received: ${eventType} for order #${displayId}`,
          );

          // Handle different event types with minimal disruption
          switch (eventType) {
            case 'INSERT':
              // For new orders, update the table silently and show a subtle indicator
              // in the UI instead of a toast notification
              break;
            case 'UPDATE':
              // For updates, only log the change - no toast needed
              break;
            case 'DELETE':
              // For deletions, only log the change - no toast needed
              // If the currently selected order was deleted, select a different one
              if (
                isOrderPayload(payload.old) &&
                selectedOrderId === payload.old.id
              ) {
                const firstAvailableOrder = orders.find(
                  o => o.id !== payload.old.id,
                );
                if (firstAvailableOrder) {
                  setSelectedOrderId(firstAvailableOrder.id);
                } else {
                  setSelectedOrderId(null);
                }
              }
              break;
          }

          // Refresh the data silently without any visual indicators
          await loadData({ silent: true });
        },
      )
      .subscribe((status: string) => {
        addLog(`Orders subscription status: ${status}`);
        setConnectionStatus(status);

        if (status === 'SUBSCRIBED') {
          // Just update the connection status indicator - no toast needed
          console.log('Realtime connected successfully');
        } else if (status === 'CHANNEL_ERROR') {
          // Only show toast for connection errors since they require attention
          toast({
            title: 'Connection Error',
            description: 'Failed to connect to real-time updates. Retrying...',
            variant: 'destructive',
            important: true, // Mark as important so user must dismiss it
          });

          // Try to reconnect after a delay
          setTimeout(() => {
            addLog('Attempting to reconnect...');
            supabaseClient.removeChannel(ordersChannel);
            // The channel will be recreated on the next render
          }, 5000);
        }
      });

    // Subscribe to changes on order_items with enhanced handling
    const orderItemsChannel = supabaseClient
      .channel('order-items-dashboard')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'order_items',
        },
        async (payload: RealtimePostgresChangesPayload<OrderPayload>) => {
          const eventType = payload.eventType;
          const itemId = isOrderPayload(payload.new)
            ? payload.new.id
            : isOrderPayload(payload.old)
            ? payload.old.id
            : 'unknown';
          const orderId =
            payload.new &&
            typeof payload.new === 'object' &&
            'order_id' in payload.new
              ? payload.new.order_id
              : payload.old &&
                typeof payload.old === 'object' &&
                'order_id' in payload.old
              ? payload.old.order_id
              : 'unknown';

          addLog(
            `Order items change detected: ${eventType} for item ${itemId} in order ${orderId}`,
          );

          // No toasts for order item changes - just update the data silently
          // Refresh the data silently without any visual indicators
          await loadData({ silent: true });
        },
      )
      .subscribe((status: string) => {
        addLog(`Order items subscription status: ${status}`);
      });

    // Add a very infrequent backup polling mechanism for reliability
    // This is just a safety net in case realtime updates fail
    const pollingInterval = setInterval(() => {
      addLog('Backup polling for order updates');
      loadData({ silent: true }); // Completely silent update for polling
    }, 300000); // Poll every 5 minutes as a backup - reduced frequency

    return () => {
      addLog('Cleaning up realtime subscriptions');
      supabaseClient.removeChannel(ordersChannel);
      supabaseClient.removeChannel(orderItemsChannel);
      clearInterval(pollingInterval);
    };
  }, [loadData, toast, selectedOrderId, orders]);

  const handleDelete = async (id: string) => {
    // No change needed here, Supabase Realtime will handle the state update via DELETE event
    try {
      const result = await deleteOrder(id);
      if (!result.success) {
        // Error is already handled by the action potentially, but add toast here for UI feedback
        // Corrected: Pass error message string to new Error()
        const errorMessage =
          typeof result.error === 'string'
            ? result.error
            : 'Failed to delete order server-side';
        throw new Error(errorMessage);
      }
      // Toast is now handled by the Realtime DELETE event handler
      // Selection logic is now handled by the Realtime DELETE event handler
    } catch (error) {
      console.error('Error initiating order deletion:', error);
      toast({
        title: 'Error',
        description: `Failed to initiate order deletion: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        variant: 'destructive',
        important: true, // Mark error as important
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
        .filter(order => {
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
            change={`${
              currentWeekChangePercentage >= 0 ? '+' : ''
            }${currentWeekChangePercentage.toFixed(2)}% from last week`}
            changePercentage={currentWeekChangePercentage}
          />
          <StatCard
            title="This Month"
            value={`Br ${currentMonthTotal.toFixed(2)}`}
            change={`${
              currentMonthChangePercentage >= 0 ? '+' : ''
            }${currentMonthChangePercentage.toFixed(2)}% from last month`}
            changePercentage={currentMonthChangePercentage}
          />
        </div>
        <Tabs defaultValue="week" className="px-4 sm:px-0">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <TabsList>
                <TabsTrigger value="week">This Week</TabsTrigger>
                <TabsTrigger value="month">This Month</TabsTrigger>
              </TabsList>

              {/* Realtime status indicator - more subtle */}
              <div className="flex items-center ml-2">
                <div
                  className={`h-2 w-2 rounded-full mr-1 ${
                    connectionStatus === 'SUBSCRIBED'
                      ? 'bg-green-500' // No animation to avoid distraction
                      : 'bg-yellow-500' // Yellow instead of red for less alarm
                  }`}
                ></div>
                <span className="text-xs text-muted-foreground">
                  {connectionStatus === 'SUBSCRIBED' ? 'Live' : 'Connecting...'}
                </span>

                {lastUpdateTime && (
                  <span className="text-xs text-muted-foreground ml-2">
                    Updated: {lastUpdateTime.toLocaleTimeString()}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1"
                onClick={() => loadData({ silent: false, showToast: true })} // Show loading state and toast for manual refresh
                disabled={isLoading}
              >
                <svg
                  className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`}
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
              onSelectOrder={setSelectedOrderId}
              onDeleteOrder={handleDelete}
              isLoading={isLoading || isUpdating}
              connectionStatus={connectionStatus}
              onOrdersUpdated={options => loadData(options)}
              setConnectionStatus={setConnectionStatus}
            />
          </TabsContent>
          <TabsContent value="month">
            <OrderTable
              key="month-orders"
              orders={orders}
              onSelectOrder={setSelectedOrderId}
              onDeleteOrder={handleDelete}
              isLoading={isLoading || isUpdating}
              connectionStatus={connectionStatus}
              onOrdersUpdated={options => loadData(options)}
              setConnectionStatus={setConnectionStatus}
            />
          </TabsContent>
        </Tabs>
      </div>
      {selectedOrderId && <OrderDetails orderId={selectedOrderId} />}
    </main>
  );
};

export default OrderDashboard;
