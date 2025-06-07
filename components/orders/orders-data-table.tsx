"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  Row,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

import { Input } from "@/components/ui/input";
import React, { useState, useEffect, useMemo, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Eye,
  Trash,
  RefreshCw,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { ExtendedOrder, OrderItem } from "@/types/order";
import { formatOrderId } from "@/lib/utils";
import { formatCurrency, formatOrderCurrency } from "@/lib/utils";
import { updateOrderStatus } from "@/app/actions/orderActions";
import { useToast } from "@/hooks/use-toast";
import { SortingState } from "@tanstack/react-table";

interface OrdersDataTableProps {
  orders: ExtendedOrder[];
  onSelectOrderAction: (id: string) => void;
  onDeleteOrderAction: (id: string) => Promise<void>;
}

const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return "No date available";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid date";
    return format(date, "PPp");
  } catch {
    return "Invalid date";
  }
};

// Define a type for the extended row data
type ExtendedOrderRow = ExtendedOrder & {
  formattedDate?: string;
  formattedAmount?: string;
  formattedDeliveryCost?: string;
  formattedDiscount?: string;
  couponInfo?: string;
};

export function OrdersDataTable({
  orders,
  onSelectOrderAction,
  onDeleteOrderAction,
}: OrdersDataTableProps) {
  const { toast } = useToast();
  const [sorting, setSorting] = useState<SortingState>([
    { id: "created_at", desc: true },
  ]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // Memoize the data transformation to prevent unnecessary re-renders
  const data = useMemo(() => {
    return orders.map((order) => ({
      ...order,
      formattedDate: order.created_at
        ? format(new Date(order.created_at), "MMM dd, yyyy HH:mm")
        : "Unknown",
      formattedAmount: formatOrderCurrency(order.total_amount || 0),
      formattedDeliveryCost: order.delivery_cost
        ? formatOrderCurrency(order.delivery_cost)
        : "N/A",
      formattedDiscount: order.discount_amount
        ? formatOrderCurrency(order.discount_amount)
        : "N/A",
      couponInfo: order.coupon_code
        ? `${order.coupon_code}`
        : order.coupon?.code
        ? `${order.coupon.code}`
        : "N/A",
    }));
  }, [orders]);

  const columns = useMemo<ColumnDef<ExtendedOrderRow>[]>(
    () => [
      {
        accessorKey: "display_id",
        header: "Order ID",
        cell: ({ row }: { row: Row<ExtendedOrderRow> }) => {
          const orderId = row.original.id;
          const displayId =
            row.original.display_id || row.original.id.slice(0, 8);
          return (
            <div
              className="font-medium cursor-pointer"
              onClick={() => onSelectOrderAction(orderId)}
            >
              #{displayId}
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }: { row: Row<ExtendedOrderRow> }) => {
          const status = row.original.status;
          const getStatusStyles = (status: string) => {
            switch (status) {
              case "completed":
                return "bg-green-100 text-green-800";
              case "processing":
                return "bg-blue-100 text-blue-800";
              case "cancelled":
                return "bg-red-100 text-red-800";
              case "pending":
                return "bg-yellow-100 text-yellow-800";
              default:
                return "bg-gray-100 text-gray-800";
            }
          };
          return (
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusStyles(
                status
              )}`}
            >
              {status}
            </span>
          );
        },
      },
      {
        accessorKey: "customer.name",
        header: "Customer",
        cell: ({ row }: { row: Row<ExtendedOrderRow> }) =>
          row.original.customer?.name || "Anonymous",
      },
      {
        accessorKey: "type",
        header: "Type",
        cell: ({ row }: { row: Row<ExtendedOrderRow> }) => (
          <span className="capitalize">{row.original.type}</span>
        ),
      },
      {
        accessorKey: "delivery_cost",
        header: "Delivery",
        cell: ({ row }: { row: Row<ExtendedOrderRow> }) =>
          row.original.formattedDeliveryCost,
      },
      {
        accessorKey: "coupon_code",
        header: "Coupon",
        cell: ({ row }: { row: Row<ExtendedOrderRow> }) =>
          row.original.couponInfo,
      },
      {
        accessorKey: "total_amount",
        header: "Amount",
        cell: ({ row }: { row: Row<ExtendedOrderRow> }) =>
          row.original.formattedAmount,
      },
      {
        accessorKey: "created_at",
        header: "Date",
        cell: ({ row }: { row: Row<ExtendedOrderRow> }) =>
          row.original.formattedDate,
      },
      {
        id: "actions",
        cell: ({ row }: { row: Row<ExtendedOrderRow> }) => {
          // Function to handle status updates
          const handleStatusUpdate = async (status: string) => {
            try {
              const result = await updateOrderStatus(row.original.id, status);
              if (result.success) {
                toast({
                  title: "Status Updated",
                  description: `Order status changed to ${status}`,
                  duration: 3000,
                });
              } else {
                toast({
                  title: "Update Failed",
                  description: result.error || "Failed to update status",
                  variant: "destructive",
                  duration: 5000,
                });
              }
            } catch (error) {
              toast({
                title: "Error",
                description:
                  error instanceof Error ? error.message : "Unknown error",
                variant: "destructive",
                duration: 5000,
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
                  onClick={() => onSelectOrderAction(row.original.id)}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  View details
                </DropdownMenuItem>

                <DropdownMenuSeparator />
                <DropdownMenuLabel>Update Status</DropdownMenuLabel>

                {currentStatus !== "pending" && (
                  <DropdownMenuItem
                    onClick={() => handleStatusUpdate("pending")}
                  >
                    <Clock className="mr-2 h-4 w-4 text-yellow-500" />
                    Mark as Pending
                  </DropdownMenuItem>
                )}

                {currentStatus !== "processing" && (
                  <DropdownMenuItem
                    onClick={() => handleStatusUpdate("processing")}
                  >
                    <RefreshCw className="mr-2 h-4 w-4 text-blue-500" />
                    Mark as Processing
                  </DropdownMenuItem>
                )}

                {currentStatus !== "completed" && (
                  <DropdownMenuItem
                    onClick={() => handleStatusUpdate("completed")}
                  >
                    <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                    Mark as Completed
                  </DropdownMenuItem>
                )}

                {currentStatus !== "cancelled" && (
                  <DropdownMenuItem
                    onClick={() => handleStatusUpdate("cancelled")}
                  >
                    <XCircle className="mr-2 h-4 w-4 text-red-500" />
                    Mark as Cancelled
                  </DropdownMenuItem>
                )}

                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={async () => {
                    await onDeleteOrderAction(row.original.id);
                  }}
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
    [onSelectOrderAction, onDeleteOrderAction, toast]
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

    </div>
  );
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey?: string;
  searchPlaceholder?: string;
  sorting?: SortingState;
  onSortingChange?: (sorting: SortingState) => void;
}

function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder = "Search...",
  sorting = [],
  onSortingChange,
}: DataTableProps<TData, TValue>) {
  const [globalFilter, setGlobalFilter] = useState("");

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: (updaterOrValue) => {
      if (onSortingChange) {
        // Handle both direct values and updater functions
        if (typeof updaterOrValue === "function") {
          const newSorting = updaterOrValue(sorting);
          onSortingChange(newSorting);
        } else {
          onSortingChange(updaterOrValue);
        }
      }
    },
    state: {
      sorting,
      globalFilter,
    },
  });

  return (
    <div>
      {searchKey && (
        <div className="flex items-center py-4">
          <Input
            placeholder={searchPlaceholder}
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="max-w-sm"
          />
        </div>
      )}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
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
      <div className="flex items-center justify-end space-x-2 py-4">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => table.previousPage()}
                isActive={false}
                aria-disabled={!table.getCanPreviousPage()}
                tabIndex={!table.getCanPreviousPage() ? -1 : 0}
              />
            </PaginationItem>
            {Array.from({ length: table.getPageCount() }, (_, i) => i + 1).map(
              (page) => (
                <PaginationItem key={page}>
                  <PaginationLink
                    onClick={() => table.setPageIndex(page - 1)}
                    isActive={
                      table.getState().pagination.pageIndex === page - 1
                    }
                    aria-current={
                      table.getState().pagination.pageIndex === page - 1
                        ? "page"
                        : undefined
                    }
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              )
            )}
            <PaginationItem>
              <PaginationNext
                onClick={() => table.nextPage()}
                isActive={false}
                aria-disabled={!table.getCanNextPage()}
                tabIndex={!table.getCanNextPage() ? -1 : 0}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}
