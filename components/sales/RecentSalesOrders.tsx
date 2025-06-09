"use client";

import { useState, useEffect, useCallback } from "react";
import { Package, PackageOpen, Clock, RotateCcw, ShoppingCart } from "lucide-react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useSalesCartStore, SalesCartItem } from "@/store/salesCartStore";

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

interface RecentSalesOrdersProps {
  userId: string; // The salesperson's user ID
  limit?: number; // Number of recent orders to show (default: 10)
  onCartUpdate?: () => void; // Optional callback when cart is updated
}

export function RecentSalesOrders({ userId, limit = 10, onCartUpdate }: RecentSalesOrdersProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reorderingOrderId, setReorderingOrderId] = useState<string | null>(null);
  const { subscribeToOrders: subscribeToOrdersRealtime } = useRealtime();
  const { addItem, clearCart } = useSalesCartStore();

  // Debug component mounting
  useEffect(() => {
    console.log('🏪 [RecentSalesOrders] Component mounted for userId:', userId, 'limit:', limit);
  }, [userId, limit]);

  const fetchRecentOrders = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get orders created by this salesperson (where profile_id = userId)
      const ordersData = await getOrders(undefined, 'RecentSalesOrders');
      
      // Filter orders created by this salesperson and limit to recent ones
      const salesOrders = ordersData
        .filter(order => order.profile_id === userId)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, limit);

      setOrders(
        salesOrders.map((order: any) => ({
          ...order,
          display_id: order.display_id ?? null,
        }))
      );
      setError(null);
    } catch (error) {
      console.error("RecentSalesOrders: Error fetching orders:", error);
      setError("Failed to load recent orders. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [userId, limit]);

  // Handle realtime order updates
  const handleOrderUpdate = useCallback((order: any, event: 'INSERT' | 'UPDATE' | 'DELETE') => {
    // Only update if this order was created by the current salesperson
    if (order.profile_id !== userId) return;

    if (event === 'INSERT') {
      setOrders(prev => [order, ...prev.slice(0, limit - 1)]); // Keep only the limit
    } else if (event === 'UPDATE') {
      setOrders(prev =>
        prev.map(existingOrder =>
          existingOrder.id === order.id ? { ...existingOrder, ...order } : existingOrder
        )
      );
    } else if (event === 'DELETE') {
      setOrders(prev => prev.filter(existingOrder => existingOrder.id !== order.id));
    }
  }, [userId, limit]);

  // Subscribe to realtime updates
  const subscribeToOrderUpdates = useCallback(() => {
    return subscribeToOrdersRealtime(handleOrderUpdate);
  }, [handleOrderUpdate, subscribeToOrdersRealtime]);

  useEffect(() => {
    fetchRecentOrders();
    const unsubscribe = subscribeToOrderUpdates();
    return unsubscribe;
  }, [fetchRecentOrders, subscribeToOrderUpdates]);

  const handleReorder = useCallback(async (order: Order) => {
    try {
      setReorderingOrderId(order.id);
      console.log('🔄 [RecentSalesOrders] Reordering order:', order.display_id);

      if (!order.order_items || order.order_items.length === 0) {
        toast.error('No items found in this order to reorder');
        return;
      }

      // Convert order items to cart items format matching SalesCartItem interface
      const cartItems: SalesCartItem[] = order.order_items.map(item => ({
        id: item.product_id,
        name: item.product_name,
        imageUrl: '/placeholder-product.svg', // Use placeholder instead of empty string
        pricePerKg: item.price / (item.quantity / 1000), // Convert back to price per kg
        grams: item.quantity, // quantity is in grams
        unit: 'kg' // Default unit
      }));

      // Add each item to cart
      let addedCount = 0;
      for (const item of cartItems) {
        try {
          addItem(item);
          addedCount++;
        } catch (error) {
          console.warn('Failed to add item to cart:', item.name, error);
        }
      }

      if (addedCount === 0) {
        toast.error('Failed to add any items to cart');
      } else if (addedCount < cartItems.length) {
        toast.warning(`Added ${addedCount} of ${cartItems.length} items to cart. Some items may no longer be available.`);
      } else {
        toast.success(`Reordered ${addedCount} items from order ${order.display_id}`, {
          description: 'Items have been added to your cart'
        });
        
        // Call callback to notify parent component
        onCartUpdate?.();
      }

    } catch (error) {
      console.error('Error reordering:', error);
      toast.error('Failed to reorder items. Please try again.');
    } finally {
      setReorderingOrderId(null);
    }
  }, [addItem]);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Recent Orders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Recent Orders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <PackageOpen className="mx-auto w-12 h-12 text-gray-400 mb-4" />
            <p className="text-red-600 mb-2">{error}</p>
            <button
              onClick={fetchRecentOrders}
              className="text-blue-600 hover:text-blue-800 underline"
            >
              Try again
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (orders.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Recent Orders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Package className="mx-auto w-12 h-12 text-gray-400 mb-4" />
            <p className="text-gray-600 mb-2">No recent orders found</p>
            <p className="text-sm text-gray-500">
              Orders you create will appear here
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Recent Orders ({orders.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">
                    {order.display_id || `#${order.id.slice(0, 8)}`}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {order.customer?.name || 'Unknown Customer'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {order.customer?.email || ''}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {order.order_items?.length || 0} item(s)
                    </div>
                    {order.order_items?.slice(0, 2).map((item, index) => (
                      <div key={index} className="text-xs text-gray-500 truncate">
                        {item.product_name} ({item.quantity}g)
                      </div>
                    ))}
                    {(order.order_items?.length || 0) > 2 && (
                      <div className="text-xs text-gray-500">
                        +{(order.order_items?.length || 0) - 2} more
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      {formatOrderCurrency(order.total_amount)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(order.status)}>
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {format(new Date(order.created_at), 'MMM dd, yyyy')}
                    </div>
                    <div className="text-xs text-gray-500">
                      {format(new Date(order.created_at), 'h:mm a')}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReorder(order)}
                        disabled={reorderingOrderId === order.id || !order.order_items?.length}
                        className="flex items-center gap-1 text-xs"
                      >
                        {reorderingOrderId === order.id ? (
                          <div className="w-3 h-3 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <RotateCcw className="w-3 h-3" />
                        )}
                        {reorderingOrderId === order.id ? 'Adding...' : 'Reorder'}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {orders.length === limit && (
          <div className="text-center mt-4">
            <p className="text-sm text-gray-500">
              Showing your {limit} most recent orders
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}