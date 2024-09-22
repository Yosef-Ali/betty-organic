"use client"
// Import necessary hooks and types
import { useEffect, useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { File, ListFilter } from "lucide-react";
import { OrdersOverviewCard } from "./OrdersOverviewCard";
import { StatCard } from "./StatCard";
import OrderDetails from "./OrderDetails";
import { OrderTable } from "./OrdersTable";
import { getOrders, getCustomers, getProducts } from '@/app/actions/orderActions';
import { Customer, Order, Product } from "@prisma/client";

// Define the OrderType and ExtendedOrder types
export const OrderType = {
  SALE: 'sale',
  REFUND: 'refund',
  CREDIT: 'credit',
} as const;
export type OrderType = typeof OrderType[keyof typeof OrderType];
type ExtendedOrder = Order & {
  customer: {
    fullName: string;
    email: string;
    imageUrl: string;
  } | null;
  type: OrderType;
};

export default function OrderDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const [ordersData, customersData, productsData] = await Promise.all([
        getOrders(),
        getCustomers(),
        getProducts(),
      ]);
      setOrders(ordersData);
      setCustomers(customersData);
      setProducts(productsData);
    }
    fetchData()
  }, []);

  // Process orders to include customer info and ensure the type is correct
  const extendedOrders: ExtendedOrder[] = orders.map(order => ({
    ...order,
    customer: order.customerId ? {
      fullName: customers.find(c => c.id === order.customerId)?.fullName ?? '',
      email: customers.find(c => c.id === order.customerId)?.email ?? '',
      imageUrl: customers.find(c => c.id === order.customerId)?.imageUrl ?? '',
    } : null,
    type: order.type as OrderType
  }));

  // Helper functions for date calculations
  function getStartOfWeek(date: Date): Date {
    const day = date.getDay(); // 0 (Sun) to 6 (Sat)
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(date.setDate(diff));
  }

  function getStartOfLastWeek(): Date {
    const date = getStartOfWeek(new Date());
    date.setDate(date.getDate() - 7);
    return date;
  }

  function getStartOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  function getStartOfLastMonth(): Date {
    const date = new Date();
    return new Date(date.getFullYear(), date.getMonth() - 1, 1);
  }

  // Compute totals using useMemo for performance optimization
  const {
    currentWeekTotal,
    lastWeekTotal,
    currentWeekChangePercentage,
    currentMonthTotal,
    lastMonthTotal,
    currentMonthChangePercentage
  } = useMemo(() => {
    // Get start dates
    const startOfCurrentWeek = getStartOfWeek(new Date());
    const startOfLastWeek = getStartOfLastWeek();
    const startOfCurrentMonth = getStartOfMonth(new Date());
    const startOfLastMonth = getStartOfLastMonth();

    // Helper function to compute totals
    const computeTotal = (startDate: Date, endDate: Date) => {
      return orders
        .filter(order => {
          const orderDate = new Date(order.createdAt);
          return orderDate >= startDate && orderDate < endDate;
        })
        .reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    };

    // Compute totals
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
      currentMonthChangePercentage
    };
  }, [orders]);

  return (
    <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 lg:grid-cols-3 xl:grid-cols-3">
      <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
          <OrdersOverviewCard />
          {/* Updated StatCards with dynamic data */}
          <StatCard
            title="This Week"
            value={`${currentWeekTotal.toFixed(2)} Br`}
            change={`${currentWeekChangePercentage >= 0 ? '+' : ''}${currentWeekChangePercentage.toFixed(2)}% from last week`}
            changePercentage={currentWeekChangePercentage}
          />
          <StatCard
            title="This Month"
            value={`${currentMonthTotal.toFixed(2)} Br`}
            change={`${currentMonthChangePercentage >= 0 ? '+' : ''}${currentMonthChangePercentage.toFixed(2)}% from last month`}
            changePercentage={currentMonthChangePercentage}
          />
        </div>
        {/* Rest of your component */}
        <Tabs defaultValue="week">
          {/* ... */}
          <TabsContent value="week">
            <OrderTable orders={extendedOrders} />
          </TabsContent>
        </Tabs>
      </div>
      <OrderDetails />
    </main>
  )
}
