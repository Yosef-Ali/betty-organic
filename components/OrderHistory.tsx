"use client";

import { useState, useEffect, useCallback } from "react";
import { Package, PackageOpen, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getOrders } from "@/app/actions/orderActions";
import { Database } from "@/types/supabase";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { formatOrderCurrency } from "@/lib/utils";
import { useRealtime } from "@/lib/supabase/realtime-provider";

type Order = Database["public"]["Tables"]["orders"]["Row"] & {
  order_items: Array<{
    id: string;
    order_id: string;
    product_id: string;
    quantity: number;
    price: number;
    product_name: string;
    products: Database["public"]["Tables"]["products"]["Row"];
  }>;
  customer: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
};

interface OrderHistoryProps {
  userId: string;
  refreshTrigger?: number;
  filterByCustomer?: boolean; // true = customer seeing their orders, false = admin/sales seeing all
}

export function OrderHistory({ userId, refreshTrigger, filterByCustomer = true }: OrderHistoryProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { subscribeToOrders } = useRealtime();

  const fetchOrders = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      // For customers (filterByCustomer=true), get orders where customer_profile_id = userId
      // For admin/sales (filterByCustomer=false), get all orders
      const ordersData = await getOrders(filterByCustomer ? userId : undefined, 'OrderHistory');

      // Filter client-side for customers to ensure we only show their orders
      let filteredOrders = ordersData;
      if (filterByCustomer) {
        filteredOrders = ordersData.filter(order => order.customer_profile_id === userId);
      }

      setOrders(
        filteredOrders.map((order: any) => ({
          ...order,
          display_id: order.display_id ?? null,
        }))
      );
      setError(null);
    } catch (error) {
      console.error("OrderHistory: Error fetching orders:", error);
      setError("Failed to load orders. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [userId, filterByCustomer]); // Stable dependencies


  // Handle realtime order updates
  const handleOrderUpdate = useCallback((order: any, event: 'INSERT' | 'UPDATE' | 'DELETE') => {
    // Only update if this order is relevant to current user
    const isRelevant = filterByCustomer ? order.customer_profile_id === userId : true;

    if (!isRelevant) return;

    if (event === 'INSERT') {
      setOrders(prev => [order, ...prev]);
    } else if (event === 'UPDATE') {
      setOrders(prev =>
        prev.map(existingOrder =>
          existingOrder.id === order.id ? { ...existingOrder, ...order } : existingOrder
        )
      );
    } else if (event === 'DELETE') {
      setOrders(prev => prev.filter(existingOrder => existingOrder.id !== order.id));
    }
  }, [userId, filterByCustomer]);

  useEffect(() => {
    const unsubscribe = subscribeToOrders(handleOrderUpdate);
    fetchOrders();

    return unsubscribe;
  }, [refreshTrigger]); // Only refreshTrigger should cause re-fetch

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-4 text-red-500">
        <p>{error}</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-8">
        <Package className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-semibold text-gray-900">No orders</h3>
        <p className="mt-1 text-sm text-gray-500">
          You haven&apos;t placed any orders yet.
        </p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Order History</h3>
      </div>
      
      {/* Desktop Table View */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Total Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-medium">
                  {order.display_id || `#${order.id.slice(0, 8)}`}
                </TableCell>
                <TableCell>
                  {order.created_at
                    ? format(new Date(order.created_at), "MMM d, yyyy")
                    : "N/A"}
                </TableCell>
                <TableCell>{order.order_items?.length || 0} items</TableCell>
                <TableCell>{formatOrderCurrency(order.total_amount)}</TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={getStatusColor(order.status)}
                  >
                    {order.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm">
                    View Details
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {orders.map((order) => (
          <div key={order.id} className="p-4 border rounded-lg bg-card">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="font-medium text-sm">
                  {order.display_id || `#${order.id.slice(0, 8)}`}
                </h4>
                <p className="text-xs text-muted-foreground mt-1">
                  {order.created_at
                    ? format(new Date(order.created_at), "MMM d, yyyy")
                    : "N/A"}
                </p>
              </div>
              <Badge
                variant="outline"
                className={`${getStatusColor(order.status)} text-xs`}
              >
                {order.status}
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <p className="text-xs text-muted-foreground">Items</p>
                <p className="text-sm font-medium">{order.order_items?.length || 0} items</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-sm font-medium">{formatOrderCurrency(order.total_amount)}</p>
              </div>
            </div>
            
            <Button variant="outline" size="sm" className="w-full text-xs">
              View Details
              <ChevronRight className="ml-2 h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
