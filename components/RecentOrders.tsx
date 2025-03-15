'use client';

import { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getRecentOrders } from '@/app/actions/supabase-actions';

type RecentOrder = {
  id: string;
  status: string;
  total_amount: number;
  type: string;
  profiles: {
    name: string;
  };
  display_id?: string;
};

export function RecentOrders() {
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Function to fetch orders that can be called multiple times
  const fetchRecentOrders = async () => {
    setIsLoading(true);
    try {
      const orders = await getRecentOrders();
      setRecentOrders(orders);
    } catch (error) {
      console.error('Error fetching recent orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchRecentOrders();

    // Set up periodic refresh every 15 seconds
    const refreshInterval = setInterval(() => {
      fetchRecentOrders();
    }, 15000);

    return () => clearInterval(refreshInterval);
  }, []);

  return (
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
        {isLoading && recentOrders.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} className="text-center py-4">
              Loading recent orders...
            </TableCell>
          </TableRow>
        ) : recentOrders.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} className="text-center py-4">
              No recent orders found
            </TableCell>
          </TableRow>
        ) : (
          recentOrders.map(order => (
            <TableRow key={order.id}>
              <TableCell className="font-medium">
                {order.display_id || order.id.slice(0, 8)}
              </TableCell>
              <TableCell>{order.profiles?.name || 'Unknown'}</TableCell>
              <TableCell>{order.status}</TableCell>
              <TableCell>{order.type}</TableCell>
              <TableCell className="text-right">
                Br {order.total_amount.toFixed(2)}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
