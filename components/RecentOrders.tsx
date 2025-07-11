"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getRecentOrders } from "@/app/actions/supabase-actions";
import { Button } from "@/components/ui/button";
import { formatOrderCurrency } from "@/lib/utils";
import { useRealtime } from "@/lib/supabase/realtime-provider";

type RecentOrder = {
  id: string;
  status: string;
  total_amount: number;
  type: string;
  profiles: {
    name: string | null;
  } | null;
  display_id?: string;
  is_guest_order?: boolean;
  guest_name?: string;
  guest_email?: string;
  guest_phone?: string;
};

export function RecentOrders() {
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const { subscribeToOrders } = useRealtime();

  // Function to fetch orders
  const fetchRecentOrders = useCallback(async () => {
    try {
      const orders = await getRecentOrders();
      setRecentOrders(orders);
    } catch (error) {
      console.error("Error fetching recent orders:", error);
    }
  }, []); // Empty dependencies

  // Handle realtime order updates
  const handleOrderUpdate = useCallback((order: any, event: 'INSERT' | 'UPDATE' | 'DELETE') => {
    if (event === 'INSERT') {
      setRecentOrders(prev => [order, ...prev.slice(0, 9)]); // Keep only 10 most recent
    } else if (event === 'UPDATE') {
      setRecentOrders(prev =>
        prev.map(existingOrder =>
          existingOrder.id === order.id ? { ...existingOrder, ...order } : existingOrder
        )
      );
    } else if (event === 'DELETE') {
      setRecentOrders(prev => prev.filter(existingOrder => existingOrder.id !== order.id));
    }
  }, []);

  // Subscribe to realtime updates and fetch initial data
  useEffect(() => {
    const unsubscribe = subscribeToOrders(handleOrderUpdate);
    fetchRecentOrders();

    return unsubscribe;
  }, []); // Empty dependencies

  return (
    <div className="space-y-3">
      {/* Desktop Table View */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Order ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4">
                  No recent orders
                </TableCell>
              </TableRow>
            ) : (
              recentOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">
                    #{order.display_id || order.id.slice(0, 8)}
                  </TableCell>
                  <TableCell className="truncate max-w-[120px]">
                    {order.is_guest_order 
                      ? (order.guest_name ? `Guest: ${order.guest_name}` : "Online Guest")
                      : (order.profiles?.name || "Unknown")
                    }
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${order.status === "confirmed"
                        ? "bg-green-100 text-green-800"
                        : order.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : order.status === "cancelled"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                    >
                      {order.status}
                    </span>
                  </TableCell>
                  <TableCell>{order.type}</TableCell>
                  <TableCell className="text-right">
                    {formatOrderCurrency(order.total_amount)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-2">
        {recentOrders.length === 0 ? (
          <div className="text-center py-6 text-sm text-muted-foreground">
            No recent orders
          </div>
        ) : (
          recentOrders.map((order) => (
            <div key={order.id} className="bg-white border rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-600">
                  #{order.display_id || order.id.slice(0, 8)}
                </span>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${order.status === "confirmed"
                    ? "bg-green-100 text-green-800"
                    : order.status === "pending"
                      ? "bg-yellow-100 text-yellow-800"
                      : order.status === "cancelled"
                        ? "bg-red-100 text-red-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                >
                  {order.status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs text-muted-foreground">Customer</p>
                  <p className="text-sm font-medium truncate">
                    {order.is_guest_order 
                      ? (order.guest_name ? `Guest: ${order.guest_name}` : "Online Guest")
                      : (order.profiles?.name || "Unknown")
                    }
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Amount</p>
                  <p className="text-sm font-medium">{formatOrderCurrency(order.total_amount)}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Type: <span className="text-foreground">{order.type}</span></p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
