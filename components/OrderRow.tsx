// OrderRow.tsx
import React from 'react';
import { TableCell, TableRow } from "@/components/ui/table";
import { ExtendedOrder } from './OrdersTable';
import { CustomerInfo } from './CustomerInfo';

type OrderRowProps = {
  order: ExtendedOrder;
  onSelectOrder: (orderId: string) => void;
};

export const OrderRow: React.FC<OrderRowProps> = ({ order, onSelectOrder }) => {
  return (
    <TableRow key={order.id} onClick={() => onSelectOrder(order.id)}>
      <TableCell>
        <CustomerInfo
          fullName={order.customer?.fullName || 'Anonymous'}
          email={order.customer?.email || 'No email'}
          imageUrl={order.customer?.imageUrl || '/public/uploads/default.jpg'}
        />
      </TableCell>
      <TableCell>{order.id}</TableCell>
      <TableCell>{order.status}</TableCell>
      <TableCell>{order.type}</TableCell>
      <TableCell>{new Date(order.createdAt).toISOString().split('T')[0]}</TableCell>
      <TableCell>{order.totalAmount.toFixed(2)} Br</TableCell>
    </TableRow>
  );
};
