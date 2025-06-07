"use client";

// OrderRow.tsx
import React from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { CustomerInfo } from "./CustomerInfo";
import { formatOrderCurrency } from "@/lib/utils";

type OrderRowProps = {
  order: any; // Use 'any' or a more specific type if available
  onSelectOrderAction: (orderId: string) => void;
};

export const OrderRow: React.FC<OrderRowProps> = ({
  order,
  onSelectOrderAction,
}) => {
  return (
    <TableRow key={order.id} onClick={() => onSelectOrderAction(order.id)}>
      <TableCell>
        <CustomerInfo
          fullName={order.customer?.name || "Anonymous"}
          email={order.customer?.email || "No email"}
          imageUrl={order.customer?.imageUrl || "/public/uploads/default.jpg"}
        />
      </TableCell>
      <TableCell>{order.display_id || order.id}</TableCell>
      <TableCell>{order.status}</TableCell>
      <TableCell>{order.type}</TableCell>
      <TableCell>
        {new Date(order.createdAt).toISOString().split("T")[0]}
      </TableCell>
      <TableCell>{formatOrderCurrency(order.totalAmount)}</TableCell>
    </TableRow>
  );
};
