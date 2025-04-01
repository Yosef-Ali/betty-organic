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
import { useAuth } from '@/hooks/useAuth';

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
  const { user, profile, loading: authLoading } = useAuth();

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousCountRef = useRef(0);
  const isInitialLoadRef = useRef(true);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const supabaseRef = useRef(createClient());
  const mountedRef = useRef(true); // Track component mount state

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

  // Wait for auth to be ready before setting up subscriptions
  useEffect(() => {
    // Set mounted ref
    mountedRef.current = true;

    // Exit early if auth is still loading
    if (authLoading) {
      console.log('Auth is still loading');
      return;
    }

    if (!user) {
      console.log('No authenticated user found');
      setError('Authentication required');
      return;
    }

    console.log('Auth loaded, user authenticated:', user.email);

    try {
      // Clear existing localStorage keys for realtime to prevent stale connections
      if (typeof localStorage !== 'undefined') {
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('supabase.realtime')) {
            localStorage.removeItem(key);
          }
        });
      }
    } catch (err) {
      console.warn('Error clearing localStorage:', err);
    }

    // Fetch notifications immediately and then set up polling
    fetchNotifications();
    const pollingInterval = setInterval(fetchNotifications, POLLING_INTERVAL);

    // Set up realtime subscription with proper error handling
    setupRealtimeSubscription();

    return () => {
      // Set mounted ref to false to avoid state updates after unmount
      mountedRef.current = false;

      clearInterval(pollingInterval);
      if (channelRef.current) {
        try {
          supabaseRef.current.removeChannel(channelRef.current);
        } catch (err) {
          console.warn('Error removing channel:', err);
        }
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [authLoading, user]);

  const setupRealtimeSubscription = () => {
    // Exit if component unmounted
    if (!mountedRef.current) return;

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
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: 'status=eq.pending'
        }, (payload) => {
          // Skip if component unmounted
          if (!mountedRef.current) return;

          console.log('Realtime order insert:', payload.new);
          fetchNotifications();
          setAnimateBell(true);
          playNotificationSound();
        })
        .on('system', { event: 'disconnect' }, () => {
          console.log('Disconnected - attempting reconnect');

          // Skip if component unmounted
          if (!mountedRef.current) return;

          // Clear any existing reconnect attempts
          if (retryTimeoutRef.current) {
            clearTimeout(retryTimeoutRef.current);
          }

          // Schedule reconnection attempt
          retryTimeoutRef.current = setTimeout(() => {
            if (mountedRef.current) {
              setupRealtimeSubscription();
            }
          }, RECONNECT_INTERVAL);
        })
        .subscribe((status) => {
          // Skip if component unmounted
          if (!mountedRef.current) return;

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
              if (mountedRef.current) {
                setupRealtimeSubscription();
              }
            }, RECONNECT_INTERVAL);
          }
        });

      channelRef.current = channel;
    } catch (error) {
      console.error('Realtime setup error:', error);

      // Skip if component unmounted
      if (!mountedRef.current) return;

      // Clear any existing reconnect attempts
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }

      // Schedule reconnection attempt with backoff
      retryTimeoutRef.current = setTimeout(() => {
        if (mountedRef.current) {
          setupRealtimeSubscription();
        }
      }, RECONNECT_INTERVAL);
    }
  };

  const fetchNotifications = async () => {
    // Skip if component is unmounted
    if (!mountedRef.current) return;

    if (retryCountRef.current >= MAX_RETRIES) {
      retryCountRef.current = 0;
      return;
    }

    // Skip if no user is authenticated
    if (!user) {
      console.log('Skipping notification fetch - no authenticated user');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const supabase = supabaseRef.current;

      const { data, error, count } = await supabase
        .from('orders')
        .select('id, status, created_at, profiles!orders_profile_id_fkey(*)', {
          count: 'exact',
        })
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Supabase fetch error:', error);
        throw new Error(error.message || 'Failed to fetch orders');
      }

      // Skip state update if component is unmounted
      if (!mountedRef.current) return;

      const actualCount = typeof count === 'number' ? count : 0;

      // Filter out null created_at and map to NotificationOrder type
      const pendingOrders = (data || [])
        .filter(order => order.created_at !== null && order.status === 'pending')
        .map(order => ({
          id: order.id,
          status: order.status,
          created_at: order.created_at as string,
          profiles: order.profiles
        }));

      console.log(`Fetched ${pendingOrders.length} pending orders`);

      const newCount = Math.max(actualCount, pendingOrders.length);

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
      // Skip state updates if component unmounted
      if (!mountedRef.current) return;

      setError(error instanceof Error ? error.message : 'Failed to fetch notifications');
      console.error('Notification fetch error:', error);

      retryCountRef.current += 1;
      const backoffTime = Math.min(1000 * Math.pow(2, retryCountRef.current), 10000);

      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = setTimeout(() => {
        if (mountedRef.current) {
          fetchNotifications();
        }
      }, backoffTime);
    } finally {
      // Skip state updates if component unmounted
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  const handleNotificationClick = (orderId: string) => {
    router.push(`/dashboard/orders/${orderId}`);
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  // Add cached profile state to prevent disappearing
  const [cachedIsAdmin, setCachedIsAdmin] = useState(false);
  
  // Only update admin status when we have a definitive answer to prevent flickering
  useEffect(() => {
    if (profile?.role === 'admin' || profile?.role === 'sales') {
      setCachedIsAdmin(true);
    }
  }, [profile]);

  // If auth is loading, use cached state if available
  if (authLoading) {
    if (cachedIsAdmin) {
      return (
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
        </Button>
      );
    }
    return (
      <Button variant="ghost" size="icon" className="relative" disabled>
        <Bell className="h-5 w-5 text-muted-foreground" />
      </Button>
    );
  }

  // If no authenticated user but we had cached admin state, still show the bell
  if (!user && !cachedIsAdmin) {
    console.log('NotificationBell: No user - hiding component');
    return null;
  }

  console.log('NotificationBell: Rendering for user', user?.email || 'cached admin');

  // Always show the bell for cached admins, otherwise check profile
  const isAdminOrSales = cachedIsAdmin || profile?.role === 'admin' || profile?.role === 'sales';
  
  // Don't render if not admin or sales
  if (!isAdminOrSales) {
    return null;
  }

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
