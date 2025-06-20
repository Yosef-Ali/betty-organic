"use client";

import React from "react";
import { ExtendedOrder } from "@/types/order";
import { OrdersDataTable } from "@/components/orders/orders-data-table";

interface OrdersTableProps {
  orders: ExtendedOrder[];
  onSelectOrderAction: (id: string) => void;
  onDeleteOrder: (id: string) => Promise<void>;
  userRole?: string;
}

const OrdersTable: React.FC<OrdersTableProps> = ({
  orders,
  onSelectOrderAction,
  onDeleteOrder,
  userRole,
}) => {
  return (
    <div className="space-y-4">
      <OrdersDataTable
        orders={orders}
        onSelectOrderAction={onSelectOrderAction}
        onDeleteOrderAction={onDeleteOrder}
        userRole={userRole}
      />

      {orders.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No orders found</p>
        </div>
      )}
    </div>
  );
};

export default OrdersTable;