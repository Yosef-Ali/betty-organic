'use client';

import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/lib/utils';

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
        {items.map(item => (
          <li key={item.id} className="flex items-center justify-between">
            <span className="text-muted-foreground">
              {item.product?.name || 'Unknown Product'} x{' '}
              <span>{(item.quantity / 1000).toFixed(3)} kg</span>
            </span>
            <span>{formatCurrency(item.total)}</span>
          </li>
        ))}
      </ul>

      <Separator className="my-2" />

      <ul className="grid gap-3">
        <li className="flex items-center justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span>{formatCurrency(subtotal)}</span>
        </li>
        <li className="flex items-center justify-between">
          <span className="text-muted-foreground">Shipping</span>
          <span className="text-muted-foreground">{formatCurrency(0)}</span>
        </li>
        <li className="flex items-center justify-between">
          <span className="text-muted-foreground">Tax</span>
          <span className="text-muted-foreground">{formatCurrency(0)}</span>
        </li>
        <li className="flex items-center justify-between font-semibold">
          <span className="text-muted-foreground">Total</span>
          <span>{formatCurrency(subtotal)}</span>
        </li>
      </ul>
    </div>
  );
}
