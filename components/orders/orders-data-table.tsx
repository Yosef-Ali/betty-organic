"use client";

import React, { useMemo, useState } from "react";
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
    getPaginationRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    SortingState,
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    MoreHorizontal,
    Eye,
    MessageCircle,
    Clock,
    RefreshCw,
    CheckCircle,
    XCircle,
    Trash,
    ChevronRight,
} from "lucide-react";
import { ExtendedOrder } from "@/types/order";
import { formatOrderCurrency } from "@/lib/utils";
import { updateOrderStatus } from "@/app/actions/orderActions";
import { sendCustomerInvoiceWhatsApp } from "@/app/actions/whatsappActions";
import { toast } from "sonner";
import { format } from "date-fns";

interface OrdersDataTableProps {
    orders: ExtendedOrder[];
    onSelectOrderAction: (id: string) => void;
    onDeleteOrderAction: (id: string) => Promise<void>;
    userRole?: string;
}

interface ExtendedOrderRow extends ExtendedOrder {
    formattedAmount: string;
    formattedDate: string;
    customerName: string;
}

export function OrdersDataTable({
    orders,
    onSelectOrderAction,
    onDeleteOrderAction,
    userRole,
}: OrdersDataTableProps) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState("");

    // Transform data for table display
    const data = useMemo<ExtendedOrderRow[]>(() => {
        return orders.map((order) => ({
            ...order,
            formattedAmount: formatOrderCurrency(order.total_amount),
            formattedDate: order.created_at
                ? format(new Date(order.created_at), "MMM d, yyyy")
                : "N/A",
            customerName: order.customer?.name || "Unknown Customer",
        }));
    }, [orders]);

    const columns = useMemo<ColumnDef<ExtendedOrderRow>[]>(
        () => [
            {
                accessorKey: "display_id",
                header: "Order ID",
                cell: ({ row }: { row: any }) => {
                    const orderId = row.original.id;
                    const displayId =
                        row.original.display_id || row.original.id.slice(0, 8);
                    return (
                        <div
                            className="font-medium cursor-pointer text-blue-600 hover:text-blue-800"
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
                cell: ({ row }: { row: any }) => {
                    const status = row.original.status;
                    const getStatusStyles = (status: string) => {
                        switch (status) {
                            case "completed":
                                return "bg-green-100 text-green-800 border-green-200";
                            case "processing":
                                return "bg-blue-100 text-blue-800 border-blue-200";
                            case "cancelled":
                                return "bg-red-100 text-red-800 border-red-200";
                            case "pending":
                                return "bg-yellow-100 text-yellow-800 border-yellow-200";
                            default:
                                return "bg-gray-100 text-gray-800 border-gray-200";
                        }
                    };
                    return (
                        <Badge
                            variant="outline"
                            className={`${getStatusStyles(status)} border`}
                        >
                            {status}
                        </Badge>
                    );
                },
            },
            {
                accessorKey: "customerName",
                header: "Customer",
                cell: ({ row }: { row: any }) => (
                    <div className="max-w-[200px] truncate">
                        {row.original.customerName}
                    </div>
                ),
            },
            {
                accessorKey: "total_amount",
                header: () => <div className="text-right">Amount</div>,
                cell: ({ row }: { row: any }) => (
                    <div className="text-right font-medium">
                        {row.original.formattedAmount}
                    </div>
                ),
            },
            {
                accessorKey: "created_at",
                header: "Date",
                cell: ({ row }: { row: any }) => row.original.formattedDate,
            },
            {
                id: "actions",
                cell: ({ row }: { row: any }) => {
                    // Function to handle status updates
                    const handleStatusUpdate = async (status: string) => {
                        try {
                            const result = await updateOrderStatus(row.original.id, status);
                            if (result.success) {
                                toast.success(`Order status changed to ${status}`);
                            } else {
                                toast.error("Failed to update order status");
                            }
                        } catch (error) {
                            toast.error("Error updating order status");
                        }
                    };

                    // Function to handle WhatsApp invoice sending
                    const handleWhatsAppInvoice = async () => {
                        try {
                            const order = row.original;
                            const customerPhone = order.customer?.phone || "";

                            if (!customerPhone) {
                                toast.error("Customer phone number not available");
                                return;
                            }

                            const result = await sendCustomerInvoiceWhatsApp({
                                customerPhone: customerPhone,
                                customerName: order.customerName,
                                orderId: order.display_id || order.id,
                                items: order.order_items?.map((item: any) => ({
                                    name: item.product_name || "Unknown Product",
                                    quantity: item.quantity || 0,
                                    price: item.total_price || 0,
                                })) || [],
                                subtotal: order.total_amount || 0, // Assuming total_amount can be used as subtotal for now
                                totalAmount: order.total_amount || 0,
                                transactionDate: new Date(order.created_at || Date.now()).toLocaleDateString(),
                                storeName: "Betty Organic",
                                storeContact: "+251944113998",
                            });

                            if (result.success) {
                                toast.success(`Invoice sent to ${customerPhone} via WhatsApp`);
                            } else {
                                toast.error(result.error || "Failed to send invoice");
                            }
                        } catch (error) {
                            toast.error("Error sending WhatsApp invoice");
                        }
                    };

                    const currentStatus = row.original.status;

                    return (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                    <span className="sr-only">Open menu</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem
                                    onClick={() => onSelectOrderAction(row.original.id)}
                                >
                                    <Eye className="mr-2 h-4 w-4" />
                                    View details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={handleWhatsAppInvoice}>
                                    <MessageCircle className="mr-2 h-4 w-4" />
                                    Send Invoice via WhatsApp
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

                                {userRole === "admin" && (
                                    <>
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
                                    </>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    );
                },
            },
        ],
        [onSelectOrderAction, onDeleteOrderAction, userRole]
    );

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        state: {
            sorting,
            globalFilter,
        },
        initialState: {
            pagination: {
                pageSize: 10,
            },
        },
    });

    return (
        <div className="space-y-4">
            {/* Search Input */}
            <div className="flex items-center space-x-2">
                <Input
                    placeholder="Search orders..."
                    value={globalFilter ?? ""}
                    onChange={(event) => setGlobalFilter(String(event.target.value))}
                    className="max-w-sm"
                />
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block">
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
                                        className="cursor-pointer hover:bg-muted/50"
                                        onClick={() => onSelectOrderAction(row.original.id)}
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
                                        No orders found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
                {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => {
                        const order = row.original;
                        return (
                            <Card
                                key={row.id}
                                className="cursor-pointer hover:shadow-md transition-shadow"
                                onClick={() => onSelectOrderAction(order.id)}
                            >
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <h4 className="font-medium text-sm text-blue-600">
                                                #{order.display_id || order.id.slice(0, 8)}
                                            </h4>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {order.formattedDate}
                                            </p>
                                        </div>
                                        <Badge
                                            variant="outline"
                                            className={`text-xs border ${order.status === "completed"
                                                    ? "bg-green-100 text-green-800 border-green-200"
                                                    : order.status === "processing"
                                                        ? "bg-blue-100 text-blue-800 border-blue-200"
                                                        : order.status === "cancelled"
                                                            ? "bg-red-100 text-red-800 border-red-200"
                                                            : "bg-yellow-100 text-yellow-800 border-yellow-200"
                                                }`}
                                        >
                                            {order.status}
                                        </Badge>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 mb-3">
                                        <div>
                                            <p className="text-xs text-muted-foreground">Customer</p>
                                            <p className="text-sm font-medium truncate">
                                                {order.customerName}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-muted-foreground">Amount</p>
                                            <p className="text-sm font-medium">
                                                {order.formattedAmount}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-xs"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onSelectOrderAction(order.id);
                                            }}
                                        >
                                            View Details
                                            <ChevronRight className="ml-1 h-3 w-3" />
                                        </Button>

                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-48">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        // Handle WhatsApp invoice
                                                    }}
                                                >
                                                    <MessageCircle className="mr-2 h-4 w-4" />
                                                    Send Invoice
                                                </DropdownMenuItem>
                                                {userRole === "admin" && (
                                                    <>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            onClick={async (e) => {
                                                                e.stopPropagation();
                                                                await onDeleteOrderAction(order.id);
                                                            }}
                                                            className="text-red-600"
                                                        >
                                                            <Trash className="mr-2 h-4 w-4" />
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })
                ) : (
                    <div className="text-center py-12">
                        <p className="text-muted-foreground">No orders found.</p>
                    </div>
                )}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                    Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{" "}
                    {Math.min(
                        (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                        table.getFilteredRowModel().rows.length
                    )}{" "}
                    of {table.getFilteredRowModel().rows.length} orders
                </div>
                <Pagination>
                    <PaginationContent>
                        <PaginationItem>
                            <PaginationPrevious
                                onClick={() => table.previousPage()}
                                className={
                                    !table.getCanPreviousPage()
                                        ? "pointer-events-none opacity-50"
                                        : "cursor-pointer"
                                }
                            />
                        </PaginationItem>
                        <PaginationItem>
                            <PaginationLink className="cursor-default">
                                Page {table.getState().pagination.pageIndex + 1} of{" "}
                                {table.getPageCount()}
                            </PaginationLink>
                        </PaginationItem>
                        <PaginationItem>
                            <PaginationNext
                                onClick={() => table.nextPage()}
                                className={
                                    !table.getCanNextPage()
                                        ? "pointer-events-none opacity-50"
                                        : "cursor-pointer"
                                }
                            />
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            </div>
        </div>
    );
}

export default OrdersDataTable;
