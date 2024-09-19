"use client"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { File, ListFilter } from "lucide-react"
import { OrdersOverviewCard } from "./OrdersOverviewCard"

import { StatCard } from "./StatCard"

import OrderDetails from "./OrderDetails"
import { OrderTable } from "./OrdersTable"
import { getOrders, getCustomers, getProducts } from '@/app/actions/orderActions';

import { useEffect, useState } from 'react'
import { Customer, Order, Product } from "@prisma/client"

// Update the ExtendedOrder type
type ExtendedOrder = Order & {
  customer: {
    fullName: string;
    email: string;
    imageUrl: string;
  } | null;
  type: OrderType; // Explicitly define type as OrderType
};

export const OrderType = {
  SALE: 'sale',
  REFUND: 'refund',
  CREDIT: 'credit',
} as const;

export type OrderType = typeof OrderType[keyof typeof OrderType];

export default function OrderDashboard() {
  const [orders, setOrders] = useState<Order[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])

  useEffect(() => {
    const fetchData = async () => {
      const [ordersData, customersData, productsData] = await Promise.all([
        getOrders(),
        getCustomers(),
        getProducts(),
      ])
      setOrders(ordersData)
      setCustomers(customersData)
      setProducts(productsData)
    }
    fetchData()
  }, [])

  const extendedOrders: ExtendedOrder[] = orders.map(order => ({
    ...order,
    customer: order.customerId ? {
      fullName: customers.find(c => c.id === order.customerId)?.fullName ?? '',
      email: customers.find(c => c.id === order.customerId)?.email ?? '',
      imageUrl: customers.find(c => c.id === order.customerId)?.imageUrl ?? '',
    } : null,
    type: order.type as OrderType // Ensure type is cast to OrderType
  }));

  return (
    <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 lg:grid-cols-3 xl:grid-cols-3">
      <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
          <OrdersOverviewCard />
          <StatCard title="This Week" value="$1,329" change="+25% from last week" changePercentage={25} />
          <StatCard title="This Month" value="$5,329" change="+10% from last month" changePercentage={12} />
        </div>
        <Tabs defaultValue="week">
          <div className="flex items-center">
            <TabsList>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="month">Month</TabsTrigger>
              <TabsTrigger value="year">Year</TabsTrigger>
            </TabsList>
            <div className="ml-auto flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7 gap-1 text-sm">
                    <ListFilter className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only">Filter</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Filter by</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem checked>Fulfilled</DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem>Declined</DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem>Refunded</DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button size="sm" variant="outline" className="h-7 gap-1 text-sm">
                <File className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only">Export</span>
              </Button>
            </div>
          </div>
          <TabsContent value="week">
            <OrderTable orders={extendedOrders} />
          </TabsContent>
        </Tabs>
      </div>
      <OrderDetails />
    </main>
  )
}