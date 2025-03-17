'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { File, PlusCircle, MoreHorizontal } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { getOrders, deleteOrder } from '@/app/actions/orderActions';

type ExtendedOrder = {
  id: string;
  customer: {
    id: string;
    name: string | null;
    email: string;
    role: string;
  } | null;
  type: string;
  status: string;
  created_at: string | null;
  total_amount: number;
  order_items: Array<{
    id: string;
    order_id: string;
    product_id: string;
    product_name: string;
    quantity: number;
    price: number;
  }>;
  display_id?: string;
};

const OrderDetailsContent: React.FC<{
  orders: ExtendedOrder[];
  isLoading: boolean;
  onDelete: (id: string) => Promise<void>;
}> = ({ orders, isLoading, onDelete }) => {
  const router = useRouter();

  if (isLoading) {
    return (
      <TableRow>
        <TableCell colSpan={7} className="h-24 text-center">
          Loading...
        </TableCell>
      </TableRow>
    );
  }

  if (orders.length === 0) {
    return (
      <TableRow>
        <TableCell colSpan={7} className="h-24 text-center">
          No orders found.
        </TableCell>
      </TableRow>
    );
  }

  return (
    <>
      {orders.map((order: ExtendedOrder) => (
        <TableRow key={order.id}>
          <TableCell className="font-medium">
            {order.customer?.name || 'N/A'}
          </TableCell>
          <TableCell>{order.display_id || order.id}</TableCell>
          <TableCell>{order.status}</TableCell>
          <TableCell>{order.type}</TableCell>
          <TableCell>
            {order.created_at
              ? formatDistanceToNow(new Date(order.created_at), { addSuffix: true })
              : 'N/A'}
          </TableCell>
          <TableCell>Br {order.total_amount.toFixed(2)}</TableCell>
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
                <DropdownMenuItem
                  onSelect={() => router.push(`/dashboard/orders/${order.id}/edit`)}
                >
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => router.push(`/dashboard/orders/${order.id}`)}
                >
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => onDelete(order.id)}>
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </TableCell>
        </TableRow>
      ))}
    </>
  );
};

export function OrderDetails() {
  const [orders, setOrders] = useState<ExtendedOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<ExtendedOrder[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getOrders();
      if (!response) {
        throw new Error('Failed to fetch orders');
      }
      setOrders(response);
      setFilteredOrders(response);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch orders. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    const filtered = orders.filter(
      order =>
        (order.customer?.name?.toLowerCase() ?? '').includes(
          searchTerm.toLowerCase(),
        ) || order.id.toLowerCase().includes(searchTerm.toLowerCase()),
    );
    setFilteredOrders(filtered);
  }, [searchTerm, orders]);

  const handleDelete = async (id: string) => {
    try {
      const result = await deleteOrder(id);
      if (!result.success) {
        throw new Error(result.error?.toString() || 'Failed to delete order');
      }
      setOrders(prevOrders => prevOrders.filter(order => order.id !== id));
      toast({
        title: 'Order deleted',
        description: 'The order has been successfully deleted.',
      });
    } catch (error) {
      console.error('Error deleting order:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete the order. Please try again.',
        variant: 'destructive',
      });
    }
  };

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
          <TableHead>
            <span className="sr-only">Actions</span>
          </TableHead>
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
  );

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
              onChange={e => setSearchTerm(e.target.value)}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild></DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuSeparator />
              </DropdownMenuContent>
            </DropdownMenu>
            <Button size="sm" variant="outline" className="h-8 gap-1">
              <File className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Export
              </span>
            </Button>
            <Button
              size="sm"
              className="h-8 gap-1"
              onClick={() => router.push('/dashboard/orders/new')}
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Add Order
              </span>
            </Button>
          </div>
        </div>
        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>Orders</CardTitle>
              <CardDescription>
                Manage your orders and view their details.
              </CardDescription>
            </CardHeader>
            <CardContent>{renderTable(filteredOrders)}</CardContent>
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
            <CardContent></CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
}
