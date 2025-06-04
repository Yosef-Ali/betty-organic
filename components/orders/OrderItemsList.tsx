"use client";

import { Separator } from "@/components/ui/separator";
import { formatCurrency, formatOrderCurrency } from "@/lib/utils";

interface OrderItem {
  id: string;
  product: { name: string };
  quantity: number;
  total: number;
}

interface OrderItemsListProps {
  items: OrderItem[];
  subtotal: number;
}

export default function OrderItemsList({
  items,
  subtotal,
}: OrderItemsListProps) {
  return (
    <div className="grid gap-3">
      <div className="font-semibold">Order Details</div>
      <ul className="grid gap-3">
        {items.map((item) => (
          <li key={item.id} className="flex items-center justify-between">
            <span className="text-muted-foreground">
              {item.product?.name || "Unknown Product"} x{" "}
              <span>{(item.quantity / 1000).toFixed(3)} kg</span>
            </span>
            <span>{formatOrderCurrency(item.total)}</span>
          </li>
        ))}
      </ul>

      <Separator className="my-2" />

      <ul className="grid gap-3">
        <li className="flex items-center justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span>{formatOrderCurrency(subtotal)}</span>
        </li>
        <li className="flex items-center justify-between">
          <span className="text-muted-foreground">Shipping</span>
          <span className="text-muted-foreground">
            {formatOrderCurrency(0)}
          </span>
        </li>
        <li className="flex items-center justify-between">
          <span className="text-muted-foreground">Tax</span>
          <span className="text-muted-foreground">
            {formatOrderCurrency(0)}
          </span>
        </li>
        <li className="flex items-center justify-between font-semibold">
          <span className="text-muted-foreground">Total</span>
          <span>{formatOrderCurrency(subtotal)}</span>
        </li>
      </ul>
    </div>
  );
}
