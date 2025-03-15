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
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

type RecentOrder = {
  id: string;
  status: string;
  total_amount: number;
  type: string;
  profiles: {
    name: string | null;
  };
  display_id?: string;
};

export function RecentOrders() {
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

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

  // Manual refresh function
  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Initial load and refresh on key change
  useEffect(() => {
    fetchRecentOrders();

    // Set up periodic refresh every 30 seconds
    const refreshInterval = setInterval(() => {
      fetchRecentOrders();
    }, 30000);

    return () => clearInterval(refreshInterval);
  }, [refreshKey]);

  return (
    <div>
      <div className="flex justify-end mb-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isLoading}
          className="flex items-center gap-1"
        >
          <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
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
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${order.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                    order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                    }`}>
                    {order.status}
                  </span>
                </TableCell>
                <TableCell>{order.type}</TableCell>
                <TableCell className="text-right">
                  Br {order.total_amount.toFixed(2)}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
