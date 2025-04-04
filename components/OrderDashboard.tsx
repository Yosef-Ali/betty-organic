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
import { getOrders, deleteOrder, getOrderById } from '../app/actions/orderActions';
import { getCustomers } from '../app/actions/profile';
import { useToast } from '../hooks/use-toast';
import OrderTable from './OrdersTable';
import type { Order, OrderItem } from '@/types/order'; // Removed CustomerProfile import
import { createClient } from '@/lib/supabase/client';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';


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
  const [connectionStatus, setConnectionStatus] = useState<string>('Not connected');
  const [logs, setLogs] = useState<string[]>([]);
  const { toast } = useToast();
  const supabase = createClient();

  // Add debug logging function
  const addLog = (message: string) => {
    console.log(`[OrderDashboard] ${message}`);
    setLogs(prev => [...prev, `${new Date().toISOString()} - ${message}`]);
  };

  // Function to convert a single raw order from DB/payload to the Order type used in UI
  const processSingleOrder = useCallback((orderData: any, customerList: any[]): Order => {
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
      role: 'customer'
    };

    // Determine customer details
    let customerDetails = fallbackCustomer;
    if (customerFromList) {
      customerDetails = {
        id: customerFromList.id,
        name: customerFromList.fullName || customerFromList.name || null, // Check multiple possible name fields
        email: customerFromList.email,
        phone: customerFromList.phone || null,
        role: 'customer' // Assuming role is always customer here
      };
    } else if (orderAny.customer) { // If customer data is directly embedded (e.g., from getOrderById)
      customerDetails = {
        id: orderAny.customer.id || 'unknown',
        name: orderAny.customer.fullName || orderAny.customer.name || null,
        email: orderAny.customer.email || 'N/A',
        phone: orderAny.customer.phone || null,
        role: 'customer'
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
      items: (orderAny.order_items || []).map((item: any): OrderItem => ({
        id: item.id,
        product_id: item.product_id,
        product_name: item.product_name || item.product?.name || 'Unknown Product', // Get name from item or nested product
        quantity: item.quantity,
        price: item.price,
        // Corrected: Only include properties expected by the type (assuming just 'name')
        product: item.product ? { name: item.product.name } : undefined
      }))
    };
  }, []);


  // Function to convert multiple database orders
  const processMultipleOrders = useCallback((ordersData: any[], customerList: any[]): Order[] => {
    return ordersData.map(order => processSingleOrder(order, customerList));
  }, [processSingleOrder]);


  // Function to load initial data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch customers first or in parallel
      const customersResponse = await getCustomers();
      const customersData = Array.isArray(customersResponse) ? customersResponse : [];
      setCustomers(customersData); // Store customers in state

      // Fetch orders
      const ordersResponse = await getOrders();
      if (!ordersResponse) {
        throw new Error('Failed to fetch orders');
      }
      const ordersData = Array.isArray(ordersResponse) ? ordersResponse : [];

      // Process orders using the stored customer list
      const processedOrders = processMultipleOrders(ordersData, customersData);

      const sortedOrders = processedOrders.sort(
        (a, b) =>
          new Date(b.created_at ?? 0).getTime() -
          new Date(a.created_at ?? 0).getTime(),
      );

      setOrders(sortedOrders);

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
      toast({
        title: 'Error',
        description: `${errorMessage}. Please try again.`,
        variant: 'destructive',
      });
      setOrders([]);
      setCustomers([]); // Clear customers on error too
      setSelectedOrderId(null); // Clear selection on error
    } finally {
      setIsLoading(false);
    }
  }, [processMultipleOrders, toast, selectedOrderId]); // Add processMultipleOrders dependency


  // Setup Supabase real-time subscriptions
  useEffect(() => {
    // Load initial data
    loadData();
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

    // Subscribe to changes on the orders table with simplified subscription
    const ordersChannel = supabaseClient
      .channel('orders-dashboard')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        async (payload) => {
          addLog(`Orders change received: ${payload.eventType}`);
          // Instead of manually processing the change, simply refresh the data
          await loadData();
        }
      )
      .subscribe((status) => {
        addLog(`Orders subscription status: ${status}`);
        setConnectionStatus(status);

        if (status === 'SUBSCRIBED') {
          toast({
            title: 'Connected',
            description: 'Real-time updates are now active',
          });
        } else if (status === 'CHANNEL_ERROR') {
          toast({
            title: 'Connection Error',
            description: 'Failed to connect to real-time updates',
            variant: 'destructive',
          });
        }
      });

    // Subscribe to changes on order_items with simplified subscription
    const orderItemsChannel = supabaseClient
      .channel('order-items-dashboard')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'order_items',
        },
        async () => {
          addLog('Order items change detected');
          // Simply refresh the data on any order items change
          await loadData();
        }
      )
      .subscribe((status) => {
        addLog(`Order items subscription status: ${status}`);
      });

    return () => {
      addLog('Cleaning up realtime subscriptions');
      supabaseClient.removeChannel(ordersChannel);
      supabaseClient.removeChannel(orderItemsChannel);
    };
  }, [loadData, toast]);


  const handleDelete = async (id: string) => {
    // No change needed here, Supabase Realtime will handle the state update via DELETE event
    try {
      const result = await deleteOrder(id);
      if (!result.success) {
        // Error is already handled by the action potentially, but add toast here for UI feedback
        // Corrected: Pass error message string to new Error()
        const errorMessage = typeof result.error === 'string' ? result.error : 'Failed to delete order server-side';
        throw new Error(errorMessage);
      }
      // Toast is now handled by the Realtime DELETE event handler
      // Selection logic is now handled by the Realtime DELETE event handler
    } catch (error) {
      console.error('Error initiating order deletion:', error);
      toast({
        title: 'Error',
        description: `Failed to initiate order deletion: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
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
            change={`${currentWeekChangePercentage >= 0 ? '+' : ''
              }${currentWeekChangePercentage.toFixed(2)}% from last week`}
            changePercentage={currentWeekChangePercentage}
          />
          <StatCard
            title="This Month"
            value={`Br ${currentMonthTotal.toFixed(2)}`}
            change={`${currentMonthChangePercentage >= 0 ? '+' : ''
              }${currentMonthChangePercentage.toFixed(2)}% from last month`}
            changePercentage={currentMonthChangePercentage}
          />
        </div>
        <Tabs defaultValue="week" className="px-4 sm:px-0">
          <div className="flex items-center">
            <TabsList>
              <TabsTrigger value="week">This Week</TabsTrigger>
              <TabsTrigger value="month">This Month</TabsTrigger>
            </TabsList>
            <div className="ml-auto flex items-center gap-2">
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
              isLoading={isLoading}
              connectionStatus={connectionStatus}
            />
          </TabsContent>
          <TabsContent value="month">
            <OrderTable
              key="month-orders"
              orders={orders}
              onSelectOrder={setSelectedOrderId}
              onDeleteOrder={handleDelete}
              isLoading={isLoading}
              connectionStatus={connectionStatus}
            />
          </TabsContent>
        </Tabs>
      </div>
      {selectedOrderId && <OrderDetails orderId={selectedOrderId} />}
    </main>
  );
};

export default OrderDashboard;
