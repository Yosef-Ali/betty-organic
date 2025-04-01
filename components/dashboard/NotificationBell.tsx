'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Bell, BellRing } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ExtendedOrder } from '@/types/order';

const MAX_RETRIES = 3;
const POLLING_INTERVAL = 30000; // 30 seconds

type NotificationOrder = Pick<ExtendedOrder, 'id' | 'status' | 'created_at' | 'profiles'> & {
  created_at: string; // Ensure created_at is not null
};

export function NotificationBell() {
  const [notifications, setNotifications] = useState<NotificationOrder[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [animateBell, setAnimateBell] = useState(false);
  const router = useRouter();

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousCountRef = useRef(0);
  const isInitialLoadRef = useRef(true);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const playNotificationSound = () => {
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio('/notification.mp3');
      }
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(e => console.warn('Audio play failed:', e));
    } catch (err) {
      console.warn('Notification sound error:', err);
    }
  };

  useEffect(() => {
    if (!animateBell) return;
    const timer = setTimeout(() => setAnimateBell(false), 1000);
    return () => clearTimeout(timer);
  }, [animateBell]);

  useEffect(() => {
    const supabase = createClient();

    if (typeof localStorage !== 'undefined') {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('supabase.realtime')) {
          localStorage.removeItem(key);
        }
      });
    }

    fetchNotifications();
    const pollingInterval = setInterval(fetchNotifications, POLLING_INTERVAL);

    const setupRealtimeSubscription = () => {
      try {
        if (channelRef.current) {
          try {
            supabase.removeChannel(channelRef.current);
          } catch (err) {
            console.warn('Error removing channel:', err);
          }
        }

        const channel = supabase.channel(`orders-notifications-${Date.now()}`)
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'orders',
            filter: 'status=eq.pending'
          }, () => {
            fetchNotifications();
            setAnimateBell(true);
            playNotificationSound();
          })
          .on('system', { event: 'disconnect' }, () => {
            console.log('Disconnected - attempting reconnect');
            setTimeout(setupRealtimeSubscription, 5000);
          })
          .subscribe(status => {
            if (status === 'SUBSCRIBED') {
              console.log('Realtime connected');
            }
          });

        channelRef.current = channel;
      } catch (error) {
        console.error('Realtime setup error:', error);
        setTimeout(setupRealtimeSubscription, 5000);
      }
    };

    const connectionTimeout = setTimeout(setupRealtimeSubscription, 1000);

    return () => {
      clearInterval(pollingInterval);
      clearTimeout(connectionTimeout);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  const fetchNotifications = async () => {
    if (retryCountRef.current >= MAX_RETRIES) {
      retryCountRef.current = 0;
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const supabase = createClient();
      const { data, error } = await supabase
        .from('orders')
        .select('id, status, created_at, profiles!orders_profile_id_fkey(*)')
        .or('status.eq.pending,status.is.null')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      // Filter out null created_at and map to NotificationOrder type
      const pendingOrders = (data || [])
        .filter(order => order.created_at !== null)
        .map(order => ({
          id: order.id,
          status: order.status,
          created_at: order.created_at as string,
          profiles: order.profiles
        }));

      const newCount = pendingOrders.length;

      if (!isInitialLoadRef.current && newCount > previousCountRef.current) {
        setAnimateBell(true);
        playNotificationSound();
      }

      previousCountRef.current = newCount;
      isInitialLoadRef.current = false;
      setNotifications(pendingOrders);
      setUnreadCount(newCount);
      retryCountRef.current = 0;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch notifications');
      console.error('Notification fetch error:', error);

      retryCountRef.current += 1;
      const backoffTime = Math.min(1000 * Math.pow(2, retryCountRef.current), 10000);

      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = setTimeout(fetchNotifications, backoffTime);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotificationClick = (orderId: string) => {
    router.push(`/dashboard/orders/${orderId}`);
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          disabled={isLoading}
        >
          {animateBell ? (
            <BellRing className={cn(
              'h-5 w-5',
              animateBell && 'animate-pulse text-yellow-500'
            )} />
          ) : (
            <Bell className="h-5 w-5" />
          )}
          {unreadCount > 0 && (
            <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        {error ? (
          <DropdownMenuItem className="text-red-500">
            Failed to load notifications
          </DropdownMenuItem>
        ) : notifications.length === 0 ? (
          <DropdownMenuItem>No new notifications</DropdownMenuItem>
        ) : (
          notifications.map(notification => (
            <DropdownMenuItem
              key={notification.id}
              onClick={() => handleNotificationClick(notification.id)}
              className="cursor-pointer"
            >
              <div className="flex flex-col">
                <span className="font-medium">
                  New {notification.status} order
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(notification.created_at).toLocaleString()}
                </span>
              </div>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
