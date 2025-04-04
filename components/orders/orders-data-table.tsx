'use client';

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  Row,
} from '@tanstack/react-table';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

import { Input } from '@/components/ui/input';
import { columns } from './columns';
import React, { useState, useEffect, useMemo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Eye, PenLine, Trash } from 'lucide-react';
import { format } from 'date-fns';
import { ExtendedOrder, OrderItem } from '@/types/order';
import { formatOrderId } from '@/lib/utils';
import { createClient } from '@supabase/supabase-js';
import { DataTable } from '@/components/ui/data-table';
import { formatCurrency } from '@/lib/utils';
import { SortingState } from '@tanstack/react-table';

interface OrdersDataTableProps {
  orders: ExtendedOrder[];
  onSelectOrder: (id: string) => void;
  onDeleteOrder: (id: string) => Promise<void>;
  isLoading: boolean;
}

const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return 'No date available';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    return format(date, 'PPp');
  } catch {
    return 'Invalid date';
  }
};

// Supabase client initialization - use environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Define a type for the extended row data
type ExtendedOrderRow = ExtendedOrder & {
  formattedDate?: string;
  formattedAmount?: string;
};

export function OrdersDataTable({
  orders,
  onSelectOrder,
  onDeleteOrder,
  isLoading,
}: OrdersDataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'created_at', desc: true }
  ]);

  // Memoize the data transformation to prevent unnecessary re-renders
  const data = useMemo(() => {
    return orders.map(order => ({
      ...order,
      formattedDate: order.created_at
        ? format(new Date(order.created_at), 'MMM dd, yyyy HH:mm')
        : 'Unknown',
      formattedAmount: formatCurrency(order.total_amount || 0),
    }));
  }, [orders]);

  const columns = useMemo<ColumnDef<ExtendedOrderRow>[]>(() => [
    {
      accessorKey: 'display_id',
      header: 'Order ID',
      cell: ({ row }: { row: Row<ExtendedOrderRow> }) => {
        const orderId = row.original.id;
        const displayId = row.original.display_id || row.original.id.slice(0, 8);
        return (
          <div className="font-medium cursor-pointer" onClick={() => onSelectOrder(orderId)}>
            #{displayId}
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: { row: Row<ExtendedOrderRow> }) => {
        const status = row.original.status;
        const getStatusStyles = (status: string) => {
          switch (status) {
            case 'completed':
              return 'bg-green-100 text-green-800';
            case 'processing':
              return 'bg-blue-100 text-blue-800';
            case 'cancelled':
              return 'bg-red-100 text-red-800';
            default:
              return 'bg-yellow-100 text-yellow-800';
          }
        };
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusStyles(status)}`}>
            {status}
          </span>
        );
      }
    },
    {
      accessorKey: 'customer.name',
      header: 'Customer',
      cell: ({ row }: { row: Row<ExtendedOrderRow> }) => row.original.customer?.name || 'Anonymous',
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }: { row: Row<ExtendedOrderRow> }) => (
        <span className="capitalize">{row.original.type}</span>
      ),
    },
    {
      accessorKey: 'total_amount',
      header: 'Amount',
      cell: ({ row }: { row: Row<ExtendedOrderRow> }) => row.original.formattedAmount,
    },
    {
      accessorKey: 'created_at',
      header: 'Date',
      cell: ({ row }: { row: Row<ExtendedOrderRow> }) => row.original.formattedDate,
    },
    {
      id: 'actions',
      cell: ({ row }: { row: Row<ExtendedOrderRow> }) => {
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onSelectOrder(row.original.id)}>
                <Eye className="mr-2 h-4 w-4" />
                View details
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDeleteOrder(row.original.id)}
                className="text-red-600"
              >
                <Trash className="mr-2 h-4 w-4" />
                Delete order
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ], [onSelectOrder, onDeleteOrder]);

  return (
    <div className="space-y-4">
      <DataTable
        columns={columns}
        data={data}
        searchKey="display_id"
      />

      {isLoading && (
        <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      )}
    </div>
  );
}
