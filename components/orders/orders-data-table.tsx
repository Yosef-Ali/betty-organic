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
import React, { useState, useEffect, useMemo, useRef } from 'react';
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
import {
  MoreHorizontal,
  Eye,
  Trash,
  RefreshCw,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { ExtendedOrder, OrderItem } from '@/types/order';
import { formatOrderId } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import type {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from '@supabase/supabase-js';
import { DataTable } from '@/components/ui/data-table';
import { formatCurrency } from '@/lib/utils';
import { updateOrderStatus } from '@/app/actions/orderActions';
import { useToast } from '@/hooks/use-toast';
import { SortingState } from '@tanstack/react-table';

interface OrdersDataTableProps {
  orders: ExtendedOrder[];
  onSelectOrder: (id: string) => void;
  onDeleteOrder: (id: string) => Promise<void>;
  isLoading: boolean;
  onOrdersUpdated?: (options?: { silent?: boolean }) => Promise<void>;
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

// Define a type for the extended row data
type ExtendedOrderRow = ExtendedOrder & {
  formattedDate?: string;
  formattedAmount?: string;
};

// Add type for the realtime payload
interface OrderPayload {
  id: string;
  [key: string]: any;
}

// Type guard to check if an object is an OrderPayload
function isOrderPayload(obj: any): obj is OrderPayload {
  return obj && typeof obj.id === 'string';
}

export function OrdersDataTable({
  orders,
  onSelectOrder,
  onDeleteOrder,
  isLoading,
  onOrdersUpdated,
}: OrdersDataTableProps) {
  const { toast } = useToast();
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'created_at', desc: true },
  ]);
  const [realTimeStatus, setRealTimeStatus] = useState<string>('Not connected');
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const mountedRef = useRef<boolean>(true);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // Initialize Supabase realtime subscription
  useEffect(() => {
    mountedRef.current = true;

    // Create Supabase client if not already created
    if (!supabaseRef.current) {
      supabaseRef.current = createClient();
    }

    // Setup realtime channel for order updates
    const setupRealtimeSubscription = () => {
      try {
        const client = supabaseRef.current;
        if (!client) {
          console.error('Supabase client not initialized');
          return;
        }

        // Remove existing channel if it exists
        if (channelRef.current) {
          try {
            client.removeChannel(channelRef.current);
          } catch (err) {
            console.warn('Error removing existing channel:', err);
          }
        }

        const channelName = 'orders-table-updates';
        console.log('Setting up orders table realtime channel:', channelName);

        const channel = client
          .channel(channelName)
          .on(
            'postgres_changes',
            {
              event: '*', // Listen for all events (INSERT, UPDATE, DELETE)
              schema: 'public',
              table: 'orders',
            },
            (payload: RealtimePostgresChangesPayload<OrderPayload>) => {
              if (!mountedRef.current) return;

              console.log('Order table change received:', {
                eventType: payload.eventType,
                orderId: isOrderPayload(payload.new)
                  ? payload.new.id
                  : isOrderPayload(payload.old)
                  ? payload.old.id
                  : 'unknown',
              });

              const eventType = payload.eventType;

              // Handle different event types with minimal disruption
              switch (eventType) {
                case 'INSERT':
                  // For new orders, update the table silently and show a subtle indicator
                  // in the UI instead of a toast notification
                  break;
                case 'UPDATE':
                  // For updates, only log the change - no toast needed
                  break;
                case 'DELETE':
                  // For deletions, only log the change - no toast needed
                  // If the currently selected order was deleted, select a different one
                  if (isOrderPayload(payload.old)) {
                    const firstAvailableOrder = orders.find(
                      o => o.id !== payload.old.id,
                    );
                    if (firstAvailableOrder) {
                      setSelectedOrderId(firstAvailableOrder.id);
                    } else {
                      setSelectedOrderId(null);
                    }
                  }
                  break;
              }

              // Handle the update by refreshing data through the parent component
              // This approach ensures all order data is consistent
              if (onOrdersUpdated) {
                onOrdersUpdated({ silent: true }).catch(err => {
                  console.error(
                    'Error updating orders after realtime event:',
                    err,
                  );
                });
              }
            },
          )
          .subscribe((status: string) => {
            if (!mountedRef.current) return;

            console.log(`Orders table - Realtime status: ${status}`);
            setRealTimeStatus(status);

            if (status === 'SUBSCRIBED') {
              console.log(
                'Orders table - Successfully subscribed to real-time updates',
              );
            } else if (status === 'CHANNEL_ERROR') {
              console.error(
                'Orders table - Channel error, will retry connection',
              );
              // Retry connection after a delay
              setTimeout(() => {
                if (mountedRef.current) {
                  setupRealtimeSubscription();
                }
              }, 5000);
            }
          });

        channelRef.current = channel;
      } catch (error) {
        console.error('Error setting up realtime subscription:', error);
      }
    };

    // Clear existing localStorage keys for realtime to prevent stale connections
    if (typeof localStorage !== 'undefined') {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('supabase.realtime')) {
          localStorage.removeItem(key);
        }
      });
    }

    // Set up the subscription
    setupRealtimeSubscription();

    // Cleanup function
    return () => {
      mountedRef.current = false;

      if (supabaseRef.current && channelRef.current) {
        try {
          supabaseRef.current.removeChannel(channelRef.current);
        } catch (err) {
          console.warn('Error removing channel during cleanup:', err);
        }
      }
    };
  }, [onOrdersUpdated, orders]);

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

  const columns = useMemo<ColumnDef<ExtendedOrderRow>[]>(
    () => [
      {
        accessorKey: 'display_id',
        header: 'Order ID',
        cell: ({ row }: { row: Row<ExtendedOrderRow> }) => {
          const orderId = row.original.id;
          const displayId =
            row.original.display_id || row.original.id.slice(0, 8);
          return (
            <div
              className="font-medium cursor-pointer"
              onClick={() => onSelectOrder(orderId)}
            >
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
              case 'pending':
                return 'bg-yellow-100 text-yellow-800';
              default:
                return 'bg-gray-100 text-gray-800';
            }
          };
          return (
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusStyles(
                status,
              )}`}
            >
              {status}
            </span>
          );
        },
      },
      {
        accessorKey: 'customer.name',
        header: 'Customer',
        cell: ({ row }: { row: Row<ExtendedOrderRow> }) =>
          row.original.customer?.name || 'Anonymous',
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
        cell: ({ row }: { row: Row<ExtendedOrderRow> }) =>
          row.original.formattedAmount,
      },
      {
        accessorKey: 'created_at',
        header: 'Date',
        cell: ({ row }: { row: Row<ExtendedOrderRow> }) =>
          row.original.formattedDate,
      },
      {
        id: 'actions',
        cell: ({ row }: { row: Row<ExtendedOrderRow> }) => {
          // Function to handle status updates
          const handleStatusUpdate = async (status: string) => {
            try {
              const result = await updateOrderStatus(row.original.id, status);
              if (result.success) {
                toast({
                  title: 'Status Updated',
                  description: `Order status changed to ${status}`,
                  duration: 3000,
                });
              } else {
                toast({
                  title: 'Update Failed',
                  description: result.error || 'Failed to update status',
                  variant: 'destructive',
                  important: true,
                });
              }
            } catch (error) {
              toast({
                title: 'Error',
                description:
                  error instanceof Error ? error.message : 'Unknown error',
                variant: 'destructive',
                important: true,
              });
            }
          };

          // Get the current status to show/hide options
          const currentStatus = row.original.status;

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
                <DropdownMenuItem
                  onClick={() => onSelectOrder(row.original.id)}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  View details
                </DropdownMenuItem>

                <DropdownMenuSeparator />
                <DropdownMenuLabel>Update Status</DropdownMenuLabel>

                {currentStatus !== 'pending' && (
                  <DropdownMenuItem
                    onClick={() => handleStatusUpdate('pending')}
                  >
                    <Clock className="mr-2 h-4 w-4 text-yellow-500" />
                    Mark as Pending
                  </DropdownMenuItem>
                )}

                {currentStatus !== 'processing' && (
                  <DropdownMenuItem
                    onClick={() => handleStatusUpdate('processing')}
                  >
                    <RefreshCw className="mr-2 h-4 w-4 text-blue-500" />
                    Mark as Processing
                  </DropdownMenuItem>
                )}

                {currentStatus !== 'completed' && (
                  <DropdownMenuItem
                    onClick={() => handleStatusUpdate('completed')}
                  >
                    <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                    Mark as Completed
                  </DropdownMenuItem>
                )}

                {currentStatus !== 'cancelled' && (
                  <DropdownMenuItem
                    onClick={() => handleStatusUpdate('cancelled')}
                  >
                    <XCircle className="mr-2 h-4 w-4 text-red-500" />
                    Mark as Cancelled
                  </DropdownMenuItem>
                )}

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
    ],
    [onSelectOrder, onDeleteOrder, toast],
  );

  return (
    <div className="space-y-4 relative">
      <DataTable
        columns={columns}
        data={data}
        searchKey="display_id"
        searchPlaceholder="Search orders..."
        sorting={sorting}
        onSortingChange={setSorting}
      />

      {/* Real-time status indicator */}
      <div className="absolute top-2 right-2 flex items-center gap-2 bg-background/80 p-2 rounded-md text-xs text-muted-foreground">
        <div
          className={`h-2 w-2 rounded-full ${
            realTimeStatus === 'SUBSCRIBED'
              ? 'bg-green-500'
              : 'bg-yellow-500 animate-pulse'
          }`}
        />
        <span>
          {realTimeStatus === 'SUBSCRIBED' ? 'Live updates' : 'Connecting...'}
        </span>
      </div>

      {/* More subtle loading indicator that doesn't block the entire table */}
      {isLoading && (
        <div className="absolute top-2 right-28 flex items-center gap-2 bg-background/80 p-2 rounded-md shadow-sm border text-xs text-muted-foreground">
          <div className="animate-spin w-3 h-3 border-2 border-primary border-t-transparent rounded-full" />
          <span>Updating...</span>
        </div>
      )}
    </div>
  );
}
