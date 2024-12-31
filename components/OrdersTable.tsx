'use client';

import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { useRouter } from 'next/navigation'; // Updated import source
import { ExtendedOrder } from '@/types'; // Import ExtendedOrder type from types folder

type OrdersTableProps = {
  orders: ExtendedOrder[]; // Use the imported ExtendedOrder type
  onSelectOrder: (id: string) => void;
  onDeleteOrder: (id: string) => Promise<void>;
  isLoading: boolean;
};

const OrdersTable: React.FC<OrdersTableProps> = ({ orders, onSelectOrder, onDeleteOrder, isLoading }) => {
  const router = useRouter();

  if (isLoading) {
    return (
      <Table>
        <TableBody>
          <TableRow>
            <TableCell colSpan={6} className="text-center">
              Loading...
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
  }

  if (orders.length === 0) {
    return (
      <Table>
        <TableBody>
          <TableRow>
            <TableCell colSpan={6} className="text-center">
              No orders found.
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
  }

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Order ID</TableCell>
          <TableCell>Customer</TableCell>
          <TableCell>Status</TableCell>
          <TableCell>Total Amount</TableCell>
          <TableCell>Created At</TableCell>
          <TableCell>Actions</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {orders.map(order => (
          <TableRow key={order.id}>
            <TableCell onClick={() => onSelectOrder(order.id)} className="cursor-pointer">
              {order.id}
            </TableCell>
            <TableCell>
              {order.customer ? (
                <>
                  <div>{order.customer.full_name}</div>
                  <div className="text-muted-foreground text-sm">{order.customer.email}</div>
                </>
              ) : (
                'N/A'
              )}
            </TableCell>
            <TableCell>
              <Badge variant="outline">{order.status}</Badge>
            </TableCell>
            <TableCell>Br {order.totalAmount.toFixed(2)}</TableCell>
            <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onSelect={() => router.push(`/dashboard/orders/${order.id}`)}>
                    View
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => onDeleteOrder(order.id)}>
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default OrdersTable;
