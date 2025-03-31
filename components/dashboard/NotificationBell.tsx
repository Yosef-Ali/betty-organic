'use client';

import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatDate } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { notificationSound } from '@/lib/utils/notifications';

interface OrderNotification {
  id: string;
  created_at: string | null;
  profile_id: string;
  status: string;
  total_amount: number;
  type: string;
  updated_at: string | null;
  profiles?: {
    id: string;
    name: string | null;
    email: string;
    role: string;
    phone?: string | null;
  };
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<OrderNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const router = useRouter();
  const previousOrdersCountRef = useRef<number>(0);

  useEffect(() => {
    const fetchNotifications = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('orders')
        .select('*, profiles:profile_id(*)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(7);

      if (error) {
        console.error('Error fetching notifications:', error);
        return;
      }

      // Play sound if new notifications arrived (and it's not the initial load)
      if (previousOrdersCountRef.current > 0 && (data?.length || 0) > previousOrdersCountRef.current) {
        console.log('New notification received, playing sound');
        notificationSound.playNotificationSound();
      }

      // Store the current count for comparison on next update
      previousOrdersCountRef.current = data?.length || 0;

      setNotifications(data || []);
      setUnreadCount(data?.length || 0);
    };

    fetchNotifications();

    // Set up real-time subscription
    const supabase = createClient();
    const channel = supabase
      .channel('orders')
      .on('postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          console.log('New order received:', payload);
          fetchNotifications();
          notificationSound.playNotificationSound();
        }
      )
      .on('postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders'
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleNotificationClick = (orderId: string) => {
    router.push(`/dashboard/orders/${orderId}`);
  };

  const getCustomerDisplay = (notification: OrderNotification) => {
    if (notification.profiles?.name) return notification.profiles.name;
    if (notification.profiles?.email) return notification.profiles.email;
    if (notification.profiles?.phone) return notification.profiles.phone;
    return 'Unknown Customer';
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="p-2">
          <h4 className="font-semibold mb-2">Recent Orders</h4>
          {notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground">No pending orders</p>
          ) : (
            <div className="space-y-2">
              {notifications.map((order) => (
                <DropdownMenuItem
                  key={order.id}
                  className="flex flex-col items-start p-2 cursor-pointer"
                  onClick={() => handleNotificationClick(order.id)}
                >
                  <div className="flex justify-between w-full">
                    <span className="font-medium">
                      {order.id.slice(0, 8)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {order.created_at ? formatDate(order.created_at) : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between w-full text-sm">
                    <span>{getCustomerDisplay(order)}</span>
                    <span>ETB {order.total_amount.toFixed(2)}</span>
                  </div>
                  <div className="w-full text-right">
                    <span className="text-xs text-yellow-600">Pending</span>
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
