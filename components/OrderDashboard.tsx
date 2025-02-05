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
import { getProducts } from '../app/actions/productActions';
import { getCustomers } from '../app/actions/profile';
import { useToast } from '../hooks/use-toast';
import OrderTable from './OrdersTable';

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  createdAt: string;
  updatedAt: string;
};

type OrderItem = {
  id: string;
  order_id: string;
  price: number;
  product_id: string;
  product_name: string;
  quantity: number;
};

type ExtendedOrder = {
  id: string;
  customerName: string;
  items: OrderItem[];
  customer: {
    id: string;
    name: string;
    full_name: string;
    email: string;
    phone: string | null;
    address: string | null;
    imageUrl: string | null;
    status: string | null;
    created_at: string | null;
    updated_at: string;
  } | null;
  type: OrderType;
  totalAmount: number;
  created_at: string | null;
  updated_at: string | null;
  status: string;
};

export const OrderType = {
  SALE: 'sale',
  REFUND: 'refund',
  CREDIT: 'credit',
} as const;

export type OrderType = (typeof OrderType)[keyof typeof OrderType];

const OrderDashboard: React.FC = () => {
  const [orders, setOrders] = useState<ExtendedOrder[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      setIsLoading(true);
      try {
        const [ordersResponse, customersResponse, productsResponse] =
          await Promise.all([getOrders(), getCustomers(), getProducts()]);

        if (!mounted) return;

        if (!ordersResponse || !customersResponse || !productsResponse) {
          throw new Error('Failed to fetch required data');
        }

        const ordersData = Array.isArray(ordersResponse) ? ordersResponse : [];
        const customersData = Array.isArray(customersResponse)
          ? customersResponse
          : [];
        const productsData = Array.isArray(productsResponse)
          ? productsResponse
          : [];

        const extendedOrders: ExtendedOrder[] = ordersData.map(order => {
          const customer = order.customer_profile_id
            ? customersData.find(
              (c: { id: string }) => c.id === order.customer_profile_id,
            )
            : null;

          const customerData = customer
            ? {
              id: customer.id || '',
              name: customer.fullName || 'Unknown',
              full_name: customer.fullName || 'Unknown',
              email: customer.email || 'No email',
              phone: customer.phone || null,
              address: customer.location || null,
              imageUrl: customer.imageUrl || null,
              status: customer.status || 'pending',
              created_at: customer.created_at || new Date().toISOString(),
              updated_at: customer.updated_at || new Date().toISOString(),
            }
            : null;

          return {
            id: order.id,
            customerName: customerData?.name || 'Unknown',
            items:
              order.order_items?.map(item => ({
                id: item.id,
                order_id: item.order_id,
                price: item.price || 0,
                product_id: item.product_id,
                product_name: item.product_name || 'Unknown Product',
                quantity: item.quantity || 0,
              })) || [],
            customer: customerData,
            type: order.type as OrderType,
            totalAmount: order.total_amount || 0,
            created_at: order.created_at || new Date().toISOString(),
            updated_at: order.updated_at || null,
            status: order.status || 'pending',
          };
        });

        const sortedOrders = extendedOrders.sort(
          (a, b) =>
            new Date(b.created_at ?? 0).getTime() -
            new Date(a.created_at ?? 0).getTime(),
        );

        if (mounted) {
          setOrders(sortedOrders);
          setProducts(productsData);

          if (sortedOrders.length > 0 && !selectedOrderId) {
            setSelectedOrderId(sortedOrders[0].id);
          }
        }
      } catch (error) {
        if (!mounted) return;

        console.error('Error fetching data:', error);
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to fetch data';
        toast({
          title: 'Error',
          description: `${errorMessage}. Please try again.`,
          variant: 'destructive',
        });
        setOrders([]);
        setProducts([]);
        if (selectedOrderId) {
          setSelectedOrderId(null);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, [toast, selectedOrderId]);

  const handleDelete = async (id: string) => {
    try {
      const result = await deleteOrder(id);
      if (result.success) {
        setOrders(prevOrders => prevOrders.filter(order => order.id !== id));
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
        .reduce((sum, order) => sum + (order.totalAmount || 0), 0);
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
      {/* {selectedOrderId && <OrderDetails orderId={selectedOrderId} />} */}
    </main>
  );
};

export default OrderDashboard;
