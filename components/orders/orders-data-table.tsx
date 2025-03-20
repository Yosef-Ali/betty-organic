'use client';

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
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
import React, { useState, useEffect } from 'react';
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
import { MoreHorizontal, Eye, PenLine } from 'lucide-react';
import { format } from 'date-fns';
import { ExtendedOrder, OrderItem } from '@/types/order';
import { formatOrderId } from '@/lib/utils';
import { createClient } from '@supabase/supabase-js';

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

export function OrdersDataTable({
  orders,
  onSelectOrder,
  onDeleteOrder,
  isLoading,
}: OrdersDataTableProps) {
  const [globalFilter, setGlobalFilter] = useState('');
  const [tableData, setTableData] = useState<ExtendedOrder[]>(orders);

  // Update tableData when orders prop changes
  useEffect(() => {
    setTableData(orders);
  }, [orders]);

  // Set up Supabase real-time subscription
  useEffect(() => {
    // Subscribe to changes on the orders table
    const subscription = supabase
      .channel('orders-changes')
      .on('postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          // Fetch the complete order with relations when a new order is inserted
          // This is needed because the payload might not include the join data
          const fetchNewOrder = async () => {
            const { data, error } = await supabase
              .from('orders')
              .select('*, profiles:profile_id(*), order_items(*)')
              .eq('id', payload.new.id)
              .single();

            if (data && !error) {
              setTableData(currentData => [data as ExtendedOrder, ...currentData]);
            }
          };

          fetchNewOrder();
        }
      )
      .on('postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          // Fetch updated order with all relations
          const fetchUpdatedOrder = async () => {
            const { data, error } = await supabase
              .from('orders')
              .select('*, profiles:profile_id(*), order_items(*)')
              .eq('id', payload.new.id)
              .single();

            if (data && !error) {
              setTableData(currentData =>
                currentData.map(order =>
                  order.id === payload.new.id ? (data as ExtendedOrder) : order
                )
              );
            }
          };

          fetchUpdatedOrder();
        }
      )
      .on('postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          // Remove the deleted order from the state
          setTableData(currentData =>
            currentData.filter(order => order.id !== payload.old.id)
          );
        }
      )
      .subscribe();

    // Cleanup subscription when component unmounts
    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  // Add handleRowClick function to show detail view
  const handleRowClick = (orderId: string) => {
    onSelectOrder(orderId);
  };

  // Handle order deletion - now we don't need to manually update the UI
  // as the real-time subscription will handle that
  const handleDeleteOrder = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();

    try {
      await onDeleteOrder(id);
      // No need to update local state manually as the real-time subscription will handle it
    } catch (error) {
      console.error('Failed to delete order:', error);
    }
  };

  // Add handleActionClick to prevent event propagation
  const handleActionClick = (e: React.MouseEvent, id: string, action: string) => {
    e.stopPropagation(); // Prevent row click event from firing

    if (action === 'view') {
      onSelectOrder(id);
    } else if (action === 'delete') {
      handleDeleteOrder(e, id);
    }
  };

  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: 'includesString',
    state: {
      globalFilter,
    },
    initialState: {
      pagination: {
        pageSize: 12,
      },
    },
    meta: {
      onDelete: handleDeleteOrder,
      onSelect: onSelectOrder,
      handleActionClick: handleActionClick,
    },
  });

  const totalPages = Math.ceil(table.getFilteredRowModel().rows.length / 12);
  const currentPage = table.getState().pagination.pageIndex + 1;

  const getPageNumbers = () => {
    const pages: number[] = [];
    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - 1 && i <= currentPage + 1)
      ) {
        pages.push(i);
      } else if (i === currentPage - 2 || i === currentPage + 2) {
        pages.push(-1); // Represents ellipsis
      }
    }
    return Array.from(new Set(pages)); // Remove duplicates
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="h-4 w-[250px] animate-pulse rounded-lg bg-muted"></div>
        <div className="h-8 w-full animate-pulse rounded-lg bg-muted"></div>
        <div className="h-8 w-full animate-pulse rounded-lg bg-muted"></div>
        <div className="h-8 w-full animate-pulse rounded-lg bg-muted"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Input
          placeholder="Search orders..."
          value={globalFilter ?? ''}
          onChange={event => {
            setGlobalFilter(event.target.value);
          }}
          className="max-w-sm"
        />
      </div>

      <div className="w-full overflow-x-hidden rounded-lg border">
        <Table className="w-full">
          <TableHeader className="md:[_&tr]:border-b hidden md:table-header-group">
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow
                key={headerGroup.id}
                className="border-b transition-colors hover:bg-muted/50"
              >
                {headerGroup.headers.map(header => (
                  <TableHead
                    key={header.id}
                    className="h-12 px-2 md:px-4 text-left text-sm md:text-base font-medium text-muted-foreground w-[120px] md:w-auto"
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody className="[&_tr:last-child]:border-0">
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map(row => (
                <React.Fragment key={row.id + '-fragment'}>
                  {/* Mobile TableRow wrapper */}
                  <TableRow
                    key={row.id + '-mobile'}
                    className="md:hidden"
                    onClick={() => handleRowClick(row.original.id)}
                  >
                    <TableCell
                      colSpan={columns.length}
                      className="p-2 md:p-0 w-screen md:w-auto"
                    >
                      <div className="card p-3 shadow rounded border w-full space-y-3 mb-3 overflow-x-hidden">
                        <div className="flex items-center gap-3">
                          {row.original.profiles && (
                            <Avatar className="h-9 w-9">
                              <AvatarImage
                                src="/placeholder-customer.png"
                              />
                              <AvatarFallback>
                                {row.original.profiles.name?.charAt(0) || '?'}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <div className="space-y-2">
                            <p className="text-sm font-medium">
                              {row.original.profiles?.name ||
                                'Unknown Customer'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatOrderId(row.original.display_id || row.original.id)}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">
                              Status:
                            </span>
                            <Badge variant="outline">
                              {row.original.status}
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">
                              Amount:
                            </span>
                            <span>Br {row.original.total_amount.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">
                              Created:
                            </span>
                            <span className="text-sm">
                              {formatDate(row.original.created_at)}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {row.original.order_items?.map((item) => (
                              <div
                                key={`${row.id}-product-${item.product_id}`}
                              >
                                <Image
                                  src="/placeholder-product.png"
                                  alt={item.product_name || 'Unknown product'}
                                  width={48}
                                  height={48}
                                  className="rounded-full object-cover border"
                                />
                              </div>
                            ))}
                            {(!row.original.order_items ||
                              !row.original.order_items.length) && (
                                <div className="text-muted-foreground text-sm">
                                  No products
                                </div>
                              )}
                          </div>
                        </div>

                        <div className="flex justify-end">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                className="h-8 w-8 p-0"
                                onClick={(e) => e.stopPropagation()} // Prevent row click
                              >
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={(e) => handleActionClick(e, row.original.id, 'view')}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View details
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={(e) => handleActionClick(e, row.original.id, 'edit')}
                              >
                                <PenLine className="mr-2 h-4 w-4" />
                                Edit status
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => handleActionClick(e, row.original.id, 'delete')}
                                className="text-destructive"
                              >
                                <PenLine className="mr-2 h-4 w-4" />
                                Delete order
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                  {/* Desktop Table Row */}
                  <TableRow
                    key={row.id}
                    className="hidden md:table-row border-b transition-colors hover:bg-muted/50 cursor-pointer"
                    onClick={() => handleRowClick(row.original.id)}
                  >
                    {row.getVisibleCells().map(cell => (
                      <TableCell
                        key={cell.id}
                        className="p-2 md:p-4 align-middle text-sm md:text-base font-medium"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                </React.Fragment>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="mt-4">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => table.previousPage()}
                className={
                  !table.getCanPreviousPage()
                    ? 'pointer-events-none opacity-50'
                    : ''
                }
              />
            </PaginationItem>
            {getPageNumbers().map((pageNumber, idx) =>
              pageNumber === -1 ? (
                <PaginationItem key={`ellipsis-${idx}`}>
                  <span className="flex h-9 w-9 items-center justify-center">
                    ...
                  </span>
                </PaginationItem>
              ) : (
                <PaginationItem key={pageNumber}>
                  <PaginationLink
                    onClick={() => table.setPageIndex(pageNumber - 1)}
                    isActive={currentPage === pageNumber}
                  >
                    {pageNumber}
                  </PaginationLink>
                </PaginationItem>
              ),
            )}
            <PaginationItem>
              <PaginationNext
                onClick={() => table.nextPage()}
                className={
                  !table.getCanNextPage()
                    ? 'pointer-events-none opacity-50'
                    : ''
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}
