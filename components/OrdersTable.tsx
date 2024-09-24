// OrdersTable.tsx
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Order } from "@prisma/client";
import { OrderType } from "./OrderDashboard";
import { OrderRow } from './OrderRow';

export interface ExtendedOrder extends Order {
  customer: {
    fullName: string;
    email: string;
    imageUrl: string;
  } | null;
  type: OrderType;
}

type OrderProps = {
  orders: ExtendedOrder[];
  onSelectOrder: (orderId: string) => void;
};

export function OrderTable({ orders, onSelectOrder }: OrderProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Orders</CardTitle>
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
