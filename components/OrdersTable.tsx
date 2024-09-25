// OrdersTable.tsx
import React, { Dispatch, SetStateAction } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Order } from "@prisma/client";
import { OrderType } from "./OrderDashboard";
import { OrderRow } from './OrderRow';
import { Button } from './ui/button';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

export interface ExtendedOrder extends Order {
  customer: {
    fullName: string;
    email: string;
    imageUrl: string;
  } | null;
  type: OrderType;
}

interface OrderProps {
  orders: ExtendedOrder[];
  onSelectOrder: Dispatch<SetStateAction<string | null>>;
  onDeleteOrder: (id: string) => Promise<void>;
  isLoading: boolean;
}

const OrderTable: React.FC<OrderProps> = ({ orders, onSelectOrder, onDeleteOrder, isLoading }) => {
  // Use the onDeleteOrder prop as needed within the component
  return (
    <Card>
      <CardHeader className="flex flex-row items-center">
        <div className="grid gap-2">
          <CardTitle>Orders</CardTitle>
          <CardDescription>Click on a row to see the details</CardDescription>
        </div>
        <Button asChild size="sm" className="ml-auto gap-1">
          <Link href="/dashboard/orders/details">
            View All
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Order ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <OrderRow key={order.id} order={order} onSelectOrder={onSelectOrder} />
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default OrderTable;
