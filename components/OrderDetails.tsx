'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { File, PlusCircle, MoreHorizontal } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { getOrders, deleteOrder } from '@/app/actions/orderActions'; // Assume these functions are defined in your API utility

type ExtendedOrder = {
  id: string;
  customer: {
    fullName: string;
    email: string;
    imageUrl: string;
  } | null;
  type: string;
  status: string;
  createdAt: string;
  totalAmount: number;
};

const OrderDetailsContent = ({ orders, isLoading, onDelete }: {
  orders: ExtendedOrder[];
  isLoading: boolean;
  onDelete: (id: string) => Promise<void>;
}) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const router = useRouter();

  if (isLoading) {
    return (
      <TableRow>
        <TableCell colSpan={7} className="h-24 text-center">
          Loading...
        </TableCell>
      </TableRow>
    )
  }

  if (orders.length === 0) {
    return (
      <TableRow>
        <TableCell colSpan={7} className="h-24 text-center">
          No orders found.
        </TableCell>
      </TableRow>
    )
  }

  return orders.map((order: ExtendedOrder) => (
    <TableRow key={order.id}>
      <TableCell className="font-medium">{order.customer?.fullName || 'N/A'}</TableCell>
      <TableCell>{order.id}</TableCell>
      <TableCell>{order.status}</TableCell>
      <TableCell>{order.type}</TableCell>
      <TableCell>{formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}</TableCell>
      <TableCell>{order.totalAmount}</TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button aria-haspopup="true" size="icon" variant="ghost">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onSelect={() => router.push(`/dashboard/orders/${order.id}/edit`)}>
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => router.push(`/dashboard/orders/${order.id}`)}>
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onDelete(order.id)}>
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  ))
}

export function OrderDetails() {
  const [orders, setOrders] = useState<ExtendedOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<ExtendedOrder[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    const filtered = orders.filter(order =>
      order.customer?.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredOrders(filtered);
  }, [searchTerm, orders]);

  async function fetchOrders() {
    setIsLoading(true);
    try {
      const fetchedOrders = (await getOrders()).map(order => ({
        ...order,
        createdAt: order.createdAt.toISOString(),
      })) as ExtendedOrder[];
      const sortedOrders = fetchedOrders.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setOrders(sortedOrders);
      setFilteredOrders(sortedOrders);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch orders",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  }

  const handleDelete = async (id: string) => {
    try {
      const result = await deleteOrder(id);
      if (result.success) {
        setOrders(prevOrders => prevOrders.filter(order => order.id !== id));
        toast({
          title: "Order deleted",
          description: "The order has been successfully deleted.",
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error deleting order:', error);
      toast({
        title: "Error",
        description: "Failed to delete the order. Please try again.",
        variant: "destructive",
      });
    }
  }

  const renderTable = (orders: ExtendedOrder[]) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Customer</TableHead>
          <TableHead>Order ID</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead><span className="sr-only">Actions</span></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <OrderDetailsContent
          orders={orders}
          isLoading={isLoading}
          onDelete={handleDelete}
        />
      </TableBody>
    </Table>
  )

  return (
    <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
      <Tabs defaultValue="all">
        <div className="flex items-center">
          <TabsList>
            <TabsTrigger value="all">All Orders</TabsTrigger>
            <TabsTrigger value="no-orders">No Orders</TabsTrigger>
          </TabsList>
          <div className="ml-auto flex items-center gap-2">
            <Input
              type="search"
              placeholder="Search orders..."
              className="h-8 w-[150px] lg:w-[250px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuSeparator />
              </DropdownMenuContent>
            </DropdownMenu>
            <Button size="sm" variant="outline" className="h-8 gap-1">
              <File className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Export</span>
            </Button>
            <Button size="sm" className="h-8 gap-1" onClick={() => router.push('/dashboard/orders/new')}>
              <PlusCircle className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Add Order</span>
            </Button>
          </div>
        </div>
        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>Orders</CardTitle>
              <CardDescription>Manage your orders and view their details.</CardDescription>
            </CardHeader>
            <CardContent>
              {renderTable(filteredOrders)}
            </CardContent>
            <CardFooter>
              <div className="text-xs text-muted-foreground">
                Showing of orders
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="no-orders">
          <Card>
            <CardHeader>
              <CardTitle>Orders with No Details</CardTitle>
            </CardHeader>
            <CardContent>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  )
}
