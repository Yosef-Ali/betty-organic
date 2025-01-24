'use client';

import React from 'react';
import { ExtendedOrder } from '@/types';
import { OrdersDataTable } from '@/components/orders/orders-data-table';

type OrdersTableProps = {
  orders: ExtendedOrder[];
  onSelectOrder: (id: string) => void;
  onDeleteOrder: (id: string) => Promise<void>;
  isLoading: boolean;
};

const OrdersTable: React.FC<OrdersTableProps> = ({
  orders,
  onSelectOrder,
  onDeleteOrder,
  isLoading,
}) => {
  return (
    <OrdersDataTable
      orders={orders}
      onSelectOrder={onSelectOrder}
      onDeleteOrder={onDeleteOrder}
      isLoading={isLoading}
    />
  );
};

export default OrdersTable;
