// OrderDashboard.tsx
'use client';

import React, { useEffect, useMemo, useCallback, useState } from 'react';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { File } from 'lucide-react';
import { OrdersOverviewCard } from './OrdersOverviewCard';
import { StatCard } from './StatCard';
import OrderDetails from './OrderDetailsCard';
import { getOrders, deleteOrder } from '../app/actions/orderActions';
import { getCustomers } from '../app/actions/profile';
import { useToast } from '../hooks/use-toast';
import OrderTable from './OrdersTable';
import type { ExtendedOrder, OrderItem } from '@/types/order';
import { createClient } from '@/lib/supabase/client';

export const OrderType = {
  SALE: 'sale',
  REFUND: 'refund',
  CREDIT: 'credit',
} as const;

export type OrderType = (typeof OrderType)[keyof typeof OrderType];

const OrderDashboard: React.FC = () => {
  const [orders, setOrders] = useState<ExtendedOrder[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const supabase = createClient();

  // Function to convert database orders to ExtendedOrder format
  const processOrders = useCallback((ordersData: any[], customersData: any[]) => {
    return ordersData.map(order => {
      // Use type assertion to avoid TypeScript errors for properties that may not be recognized
      const orderAny = order as any;

      // Get customer info either from the customer property or from customersData
      const customerFromProps = orderAny.customer_profile_id
        ? customersData.find(c => c.id === orderAny.customer_profile_id)
        : null;

      return {
        id: order.id,
        display_id: orderAny.display_id || null,
        profile_id: order.profile_id,
        customer_profile_id: orderAny.customer_profile_id || null,
        customerName: customerFromProps?.fullName || 'Unknown',
        status: order.status,
        type: order.type as OrderType,
        total_amount: order.total_amount || 0,
        created_at: order.created_at,
        updated_at: order.updated_at,
        items: (orderAny.order_items || []) as OrderItem[],
        order_items: (orderAny.order_items || []) as OrderItem[],
        profiles: customerFromProps ? {
          id: customerFromProps.id,
          name: customerFromProps.fullName || null,
          email: customerFromProps.email,
          role: 'customer' // Default to customer role
        } : undefined
      };
    });
  }, []);

  // Function to load initial data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [ordersResponse, customersResponse] =
        await Promise.all([getOrders(), getCustomers()]);

      if (!ordersResponse || !customersResponse) {
        throw new Error('Failed to fetch required data');
      }

      const ordersData = Array.isArray(ordersResponse) ? ordersResponse : [];
      const customersData = Array.isArray(customersResponse)
        ? customersResponse
        : [];

      const extendedOrders = processOrders(ordersData, customersData);

      const sortedOrders = extendedOrders.sort(
        (a, b) =>
          new Date(b.created_at ?? 0).getTime() -
          new Date(a.created_at ?? 0).getTime(),
      );

      setOrders(sortedOrders);

      if (sortedOrders.length > 0 && !selectedOrderId) {
        setSelectedOrderId(sortedOrders[0].id);
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
      if (selectedOrderId) {
        setSelectedOrderId(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, [processOrders, toast, selectedOrderId]);

  // Setup Supabase real-time subscriptions
  useEffect(() => {
    loadData();

    // Subscribe to changes on the orders table
    const ordersSubscription = supabase
      .channel('table-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all changes (insert, update, delete)
          schema: 'public',
          table: 'orders',
        },
        async (payload) => {
          console.log('Orders change received:', payload);

          // Reload data when changes are detected
          await loadData();

          // Provide feedback to the user
          if (payload.eventType === 'INSERT') {
            toast({
              title: 'New Order',
              description: 'A new order has been created.',
            });
          } else if (payload.eventType === 'UPDATE') {
            toast({
              title: 'Order Updated',
              description: `Order ${payload.new.id} has been updated.`,
            });
          } else if (payload.eventType === 'DELETE') {
            toast({
              title: 'Order Deleted',
              description: 'An order has been deleted.',
            });
            // If the deleted order is the currently selected one, clear the selection
            if (selectedOrderId === payload.old.id) {
              setSelectedOrderId(null);
            }
          }
        }
      )
      .subscribe();

    // Subscribe to changes on the order_items table as well
    const orderItemsSubscription = supabase
      .channel('order-items-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'order_items',
        },
        async () => {
          // Reload data when order items change
          await loadData();
        }
      )
      .subscribe();

    // Cleanup function to remove subscriptions
    return () => {
      supabase.removeChannel(ordersSubscription);
      supabase.removeChannel(orderItemsSubscription);
    };
  }, [loadData, supabase, toast, selectedOrderId]);

  const handleDelete = async (id: string) => {
    try {
      const result = await deleteOrder(id);
      if (result.success) {
        toast({
          title: 'Order deleted',
          description: 'The order has been successfully deleted.',
        });
        if (selectedOrderId === id) {
          setSelectedOrderId(orders[0]?.id || null);
        }
      } else {
        throw new Error('Failed to delete order');
      }
    } catch (error) {
      console.error('Error deleting order:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete the order. Please try again.',
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
            />
          </TabsContent>
          <TabsContent value="month">
            <OrderTable
              key="month-orders"
              orders={orders}
              onSelectOrder={setSelectedOrderId}
              onDeleteOrder={handleDelete}
              isLoading={isLoading}
            />
          </TabsContent>
        </Tabs>
      </div>
      {selectedOrderId && <OrderDetails orderId={selectedOrderId} />}
    </main>
  );
};

export default OrderDashboard;
