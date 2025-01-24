'use client';

import { Button } from '@/components/ui/button';
import { Copy, Truck } from 'lucide-react';
import { CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useState } from 'react';

interface OrderHeaderProps {
  order: {
    id: string;
    createdAt: string;
  };
  onTrashClick: () => void;
}

export default function OrderHeader({ order, onTrashClick }: OrderHeaderProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(order.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <CardHeader className="flex flex-row items-start bg-muted/50">
      <div className="grid gap-0.5">
        <CardTitle className="group flex items-center gap-2 text-lg">
          Order {order.id}
          <Button
            size="icon"
            variant="outline"
            className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
            onClick={handleCopy}
          >
            <Copy className="h-3 w-3" />
            <span className="sr-only">
              {copied ? 'Copied!' : 'Copy Order ID'}
            </span>
          </Button>
        </CardTitle>
        <CardDescription>
          Date: {new Date(order.createdAt).toLocaleDateString()}
        </CardDescription>
      </div>
      <div className="ml-auto flex items-center gap-1">
        <Button size="sm" variant="outline" className="h-8 gap-1">
          <Truck className="h-3.5 w-3.5" />
          <span className="lg:sr-only xl:not-sr-only xl:whitespace-nowrap">
            Track Order
          </span>
        </Button>
        <Button
          size="icon"
          variant="outline"
          className="h-8 w-8"
          onClick={onTrashClick}
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 15 15"
            fill="none"
            className="h-4 w-4"
          >
            <path
              d="M5.5 1C5.22386 1 5 1.22386 5 1.5C5 1.77614 5.22386 2 5.5 2H9.5C9.77614 2 10 1.77614 10 1.5C10 1.22386 9.77614 1 9.5 1H5.5ZM3 3.5C3 3.22386 3.22386 3 3.5 3H11.5C11.7761 3 12 3.22386 12 3.5C12 3.77614 11.7761 4 11.5 4H3.5C3.22386 4 3 3.77614 3 3.5ZM3 5.5C3 5.22386 3.22386 5 3.5 5H11.5C11.7761 5 12 5.22386 12 5.5V12.5C12 12.7761 11.7761 13 11.5 13H3.5C3.22386 13 3 12.7761 3 12.5V5.5ZM4 6V12H11V6H4Z"
              fill="currentColor"
              fillRule="evenodd"
              clipRule="evenodd"
            />
          </svg>
          <span className="sr-only">Delete</span>
        </Button>
      </div>
    </CardHeader>
  );
}
