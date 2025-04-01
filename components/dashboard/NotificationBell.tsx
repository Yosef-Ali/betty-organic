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
const RECONNECT_INTERVAL = 5000; // 5 seconds for connection retries

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
  const supabaseRef = useRef(createClient());

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

  // Ensure authentication is valid before setting up subscriptions
  useEffect(() => {
    const checkAuthAndSetup = async () => {
      try {
        const supabase = supabaseRef.current;
        const { data, error } = await supabase.auth.getSession();

        if (error || !data.session) {
          console.log('No valid auth session, checking for refresh token');
          // Try to refresh token if available
          const { data: refreshData } = await supabase.auth.refreshSession();
          if (!refreshData.session) {
            console.warn('No valid session available');
            setError('Authentication required');
            return;
          }
        }

        // Clear existing localStorage keys for realtime to prevent stale connections
        if (typeof localStorage !== 'undefined') {
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith('supabase.realtime')) {
              localStorage.removeItem(key);
            }
          });
        }

        // Fetch notifications immediately and then set up polling
        await fetchNotifications();
        const pollingInterval = setInterval(fetchNotifications, POLLING_INTERVAL);

        // Set up realtime subscription with proper error handling
        setupRealtimeSubscription();

        return () => {
          clearInterval(pollingInterval);
          if (channelRef.current) {
            try {
              supabase.removeChannel(channelRef.current);
            } catch (err) {
              console.warn('Error removing channel:', err);
            }
          }
          if (retryTimeoutRef.current) {
            clearTimeout(retryTimeoutRef.current);
          }
        };
      } catch (err) {
        console.error('Auth setup error:', err);
        setError('Failed to initialize notification system');
      }
    };

    checkAuthAndSetup();
  }, []);

  const setupRealtimeSubscription = () => {
    try {
      const supabase = supabaseRef.current;

      // Remove existing channel if it exists
      if (channelRef.current) {
        try {
          supabase.removeChannel(channelRef.current);
        } catch (err) {
          console.warn('Error removing existing channel:', err);
        }
      }

      // Create a unique channel name with timestamp to avoid conflicts
      const channelName = `orders-notifications-${Date.now()}`;

      const channel = supabase.channel(channelName)
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

          // Clear any existing reconnect attempts
          if (retryTimeoutRef.current) {
            clearTimeout(retryTimeoutRef.current);
          }

          // Schedule reconnection attempt
          retryTimeoutRef.current = setTimeout(() => {
            setupRealtimeSubscription();
          }, RECONNECT_INTERVAL);
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('Realtime connected');
          } else if (status === 'CHANNEL_ERROR') {
            console.error('Realtime channel error, will retry');

            // Clear any existing reconnect attempts
            if (retryTimeoutRef.current) {
              clearTimeout(retryTimeoutRef.current);
            }

            // Schedule reconnection attempt with backoff
            retryTimeoutRef.current = setTimeout(() => {
              setupRealtimeSubscription();
            }, RECONNECT_INTERVAL);
          }
        });

      channelRef.current = channel;
    } catch (error) {
      console.error('Realtime setup error:', error);

      // Clear any existing reconnect attempts
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }

      // Schedule reconnection attempt with backoff
      retryTimeoutRef.current = setTimeout(() => {
        setupRealtimeSubscription();
      }, RECONNECT_INTERVAL);
    }
  };

  const fetchNotifications = async () => {
    if (retryCountRef.current >= MAX_RETRIES) {
      retryCountRef.current = 0;
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const supabase = supabaseRef.current;

      // Check session validity before making the request
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        // Try to refresh token
        const { data: refreshData } = await supabase.auth.refreshSession();
        if (!refreshData.session) {
          throw new Error('No valid authentication session');
        }
      }

      const { data, error, count } = await supabase
        .from('orders')
        .select('id, status, created_at, profiles!orders_profile_id_fkey(*)', {
          count: 'exact',
        })
        .or('status.eq.pending,status.is.null')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Supabase fetch error:', error);

        // Try to extract count from Content-Range if available
        let extractedCount = 0;
        if (error && typeof error === 'object') {
          const supabaseError = error as { message?: string };
          const contentRangeMatch = supabaseError.message?.match(/Content-Range: \d+-\d+\/(\d+)/);
          if (contentRangeMatch) {
            extractedCount = parseInt(contentRangeMatch[1], 10);
          }
        }

        throw new Error(
          error.message?.includes('CORS')
            ? 'Failed to fetch orders. Please check CORS settings.'
            : error.message || 'Failed to fetch orders'
        );
      }

      const actualCount = typeof count === 'number' ? count : 0;

      // Filter out null created_at and map to NotificationOrder type
      const pendingOrders = (data || [])
        .filter(order => order.created_at !== null)
        .map(order => ({
          id: order.id,
          status: order.status,
          created_at: order.created_at as string,
          profiles: order.profiles
        }));

      const newCount = actualCount || pendingOrders.length;

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
      setError(error instanceof Error ?
        `Failed to fetch notifications: ${error.message.includes('CORS') ?
          'CORS error - check server settings' : error.message}` :
        'Failed to fetch notifications');
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
