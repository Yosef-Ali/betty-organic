import React, { useEffect, useState, useRef } from 'react';
import { Bell, BellRing } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
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
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'; // Import payload type

const MAX_RETRIES = 3; // Max retries for initial fetch
// const POLLING_INTERVAL = 30000; // REMOVED POLLING
const RECONNECT_INTERVAL = 5000; // 5 seconds for connection retries
const DEBUG_REALTIME = true; // Enable debug logging

type NotificationOrder = Pick<
  ExtendedOrder,
  'id' | 'status' | 'created_at' | 'profiles'
> & {
  created_at: string; // Ensure created_at is not null
};

export function NotificationBell() {
  const [notifications, setNotifications] = useState<NotificationOrder[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [animateBell, setAnimateBell] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null);
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const retryCountRef = useRef(0); // Keep for initial fetch retries
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Keep for initial fetch/connection retries
  // const previousCountRef = useRef(0); // REMOVED - count updated directly
  // const isInitialLoadRef = useRef(true); // REMOVED - initial fetch handled differently
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

  const fetchNotifications = async () => {
    // Skip if component is unmounted
    if (!mountedRef.current) return;

    if (retryCountRef.current >= MAX_RETRIES) {
      retryCountRef.current = 0;
      return;
    }

    // Continue even if no user is authenticated - we'll handle errors gracefully
    // This allows the component to work in test environments
    if (!user) {
      if (DEBUG_REALTIME)
        console.log(
          'No authenticated user - will try to fetch notifications anyway',
        );
      // Don't return, continue with the fetch
    }

    try {
      setIsLoading(true);
      setError(null);

      const supabase = supabaseRef.current;
      // Add null check for supabase
      if (!supabase) {
        console.error('Supabase client not initialized in fetchNotifications');
        setError('Supabase client not available');
        setIsLoading(false);
        return;
      }

      if (DEBUG_REALTIME) console.log('Fetching notification data...');

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

      if (DEBUG_REALTIME) {
        console.log(
          `fetchNotifications: Received count = ${actualCount}, data length = ${data?.length ?? 0
          }`,
        );
      }

      // Filter out null created_at and map to NotificationOrder type
      const pendingOrders = (data || [])
        .filter((order: any) => order?.created_at && order.status === 'pending')
        .map((order: any): NotificationOrder => ({ // Ensure correct type mapping
          id: order.id,
          status: order.status,
          created_at: order.created_at as string, // Already filtered non-null
          profiles: order.profiles,
        }));

      if (DEBUG_REALTIME) {
        console.log(
          `fetchNotifications (Initial Load): Filtered pending orders = ${pendingOrders.length}`,
        );
      }

      // Set initial state based on fetch
      setNotifications(pendingOrders);
      setUnreadCount(actualCount); // Use actualCount directly from initial fetch
      retryCountRef.current = 0; // Reset retries on successful fetch
    } catch (error) {
      // Skip state updates if component unmounted
      if (!mountedRef.current) return;

      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch notifications';
      setError(errorMessage);
      console.error('Initial Notification fetch error:', error);

      // Retry logic specifically for initial fetch
      if (retryCountRef.current < MAX_RETRIES) {
        retryCountRef.current += 1;
        const backoffTime = Math.min(
          1000 * Math.pow(2, retryCountRef.current),
          10000,
        );
        console.log(`Retrying initial fetch in ${backoffTime}ms (Attempt ${retryCountRef.current})`);
        if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = setTimeout(() => {
          if (mountedRef.current) {
            fetchNotifications(); // Retry initial fetch
          }
        }, backoffTime);
      } else {
        console.error(`Max retries (${MAX_RETRIES}) reached for initial notification fetch.`);
        setError(`Failed to load notifications after ${MAX_RETRIES} attempts. ${errorMessage}`);
      }
    } finally {
      // Skip state updates if component unmounted
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  const setupRealtimeSubscription = () => {
    // Exit if component unmounted
    if (!mountedRef.current) return;

    try {
      const supabase = supabaseRef.current;
      // Add null check for supabase
      if (!supabase) {
        console.error(
          'Supabase client not initialized in setupRealtimeSubscription',
        );
        setError('Supabase client not available');
        return;
      }

      // Remove existing channel if it exists
      if (channelRef.current) {
        try {
          supabase.removeChannel(channelRef.current);
        } catch (err) {
          console.warn('Error removing existing channel:', err);
        }
      }

      // Channel name for postgres_changes
      const channelName = 'order-status';

      if (DEBUG_REALTIME) {
        console.log('Setting up realtime subscription:', {
          channelName,
          userId: user?.id,
          role: profile?.role,
        });
      }

      // Create channel with the correct pattern from official docs
      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'orders',
            // No filter needed here, we handle status changes in the callback
            // filter: 'status=eq.pending', // REMOVED FILTER
          },
          (payload: RealtimePostgresChangesPayload<any>) => { // Add type to payload
            // Skip if component unmounted
            if (!mountedRef.current) return;

            if (DEBUG_REALTIME) {
              console.log('Realtime Order change received:', {
                eventType: payload.eventType,
                new: payload.new,
                old: payload.old,
                timestamp: new Date().toISOString(),
              });
            }

            const newRecord = payload.new as any;
            const oldRecord = payload.old as any;

            // Helper to create NotificationOrder from payload record
            const createNotification = (record: any): NotificationOrder | null => {
              if (!record || !record.created_at || !record.id || !record.status) return null;
              return {
                id: record.id,
                status: record.status,
                created_at: record.created_at as string,
                profiles: record.profiles, // Assuming profiles are included in the payload if selected
              };
            };

            if (payload.eventType === 'INSERT') {
              if (newRecord?.status === 'pending') {
                const newNotification = createNotification(newRecord);
                if (newNotification) {
                  if (DEBUG_REALTIME) console.log('INSERT pending:', newNotification);
                  setNotifications(prev => [newNotification, ...prev.slice(0, 9)]); // Add to start, limit to 10
                  setUnreadCount(prev => prev + 1);
                  setAnimateBell(true);
                  playNotificationSound();
                }
              }
            } else if (payload.eventType === 'UPDATE') {
              const oldStatus = oldRecord?.status;
              const newStatus = newRecord?.status;

              if (oldStatus !== 'pending' && newStatus === 'pending') {
                // Became pending
                const newNotification = createNotification(newRecord);
                if (newNotification) {
                  if (DEBUG_REALTIME) console.log('UPDATE to pending:', newNotification);
                  setNotifications(prev => [newNotification, ...prev.filter(n => n.id !== newNotification.id).slice(0, 9)]);
                  setUnreadCount(prev => prev + 1);
                  setAnimateBell(true);
                  playNotificationSound();
                }
              } else if (oldStatus === 'pending' && newStatus !== 'pending') {
                // No longer pending
                if (DEBUG_REALTIME) console.log('UPDATE from pending:', oldRecord);
                setNotifications(prev => prev.filter(n => n.id !== oldRecord.id));
                setUnreadCount(prev => Math.max(0, prev - 1));
              } else if (oldStatus === 'pending' && newStatus === 'pending') {
                // Still pending, update details if necessary (e.g., profile info)
                const updatedNotification = createNotification(newRecord);
                if (updatedNotification) {
                  if (DEBUG_REALTIME) console.log('UPDATE still pending:', updatedNotification);
                  setNotifications(prev => prev.map(n => n.id === updatedNotification.id ? updatedNotification : n));
                  // Do NOT change unread count or animate/sound here
                }
              }
            } else if (payload.eventType === 'DELETE') {
              if (oldRecord?.status === 'pending') {
                // Deleted while pending
                if (DEBUG_REALTIME) console.log('DELETE pending:', oldRecord);
                setNotifications(prev => prev.filter(n => n.id !== oldRecord.id));
                setUnreadCount(prev => Math.max(0, prev - 1));
              }
            }
          }
        )
        .subscribe((status) => {
          if (!mountedRef.current) return;

          setConnectionStatus(status);

          if (DEBUG_REALTIME) {
            console.log(
              `Realtime ${channelName} status:`,
              status,
              new Date().toISOString(),
            );
          }

          if (status === 'SUBSCRIBED') {
            if (DEBUG_REALTIME) console.log('Realtime connected successfully');
            // Fetch initial notifications upon successful subscription
            fetchNotifications(); // Fetch initial state
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.error(
              `Realtime channel error or timed out (${status}), will retry`,
            );
            if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
            retryTimeoutRef.current = setTimeout(() => {
              if (mountedRef.current) setupRealtimeSubscription();
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

  // Keep track of refresh attempts to avoid infinite loops
  const refreshAttemptRef = useRef(0);

  // Function to handle auth refresh
  const refreshAuth = async () => {
    try {
      // Only try refreshing 3 times max
      if (refreshAttemptRef.current >= 3) return;

      refreshAttemptRef.current += 1;

      if (DEBUG_REALTIME)
        console.log('Attempting auth refresh', refreshAttemptRef.current);

      // Create a new Supabase client after refresh
      supabaseRef.current = createClient();

      // Set up realtime subscription after refresh
      setupRealtimeSubscription();

      // Fetch notifications
      fetchNotifications();
    } catch (err) {
      console.error('Auth refresh error:', err);
      setError('Authentication error. Please reload the page.');
    }
  };

  // Listen for auth state changes
  useEffect(() => {
    // Skip if not mounted or no user
    if (!mountedRef.current || !user) return;

    const {
      data: { subscription },
    } = supabaseRef.current.auth.onAuthStateChange((event, session) => {
      if (DEBUG_REALTIME) console.log('Auth event:', event);

      if (event === 'TOKEN_REFRESHED') {
        if (DEBUG_REALTIME) console.log('Token refreshed successfully');
        // Refresh data without full re-instantiation
        fetchNotifications();
      } else if (event === 'SIGNED_OUT') {
        // Clean up and hide component
        setNotifications([]);
        setUnreadCount(0);
      } else if (event === 'USER_UPDATED') {
        // Fetch fresh data
        fetchNotifications();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  // Wait for auth to be ready before setting up subscriptions
  useEffect(() => {
    try {
      // Set mounted ref
      mountedRef.current = true;

      // Exit early if auth is still loading
      if (authLoading) {
        if (DEBUG_REALTIME) console.log('Auth is still loading');
        return;
      }

      if (!user) {
        if (DEBUG_REALTIME) console.log('No authenticated user found');
        setError('Authentication required');
        return;
      }

      if (DEBUG_REALTIME) {
        console.log('Auth state:', {
          user: user.id,
          email: user.email,
          role: profile?.role,
          isLoading: authLoading,
        });
      }

      // Clear existing localStorage keys for realtime to prevent stale connections
      if (typeof localStorage !== 'undefined') {
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('supabase.realtime')) {
            localStorage.removeItem(key);
          }
        });
      }

      // Fetch notifications immediately (handled by subscribe callback now)
      // fetchNotifications(); // REMOVED - Handled by subscribe status change
      // const pollingInterval = setInterval(fetchNotifications, POLLING_INTERVAL); // REMOVED POLLING

      // Set up realtime subscription with proper error handling
      setupRealtimeSubscription(); // This will trigger initial fetch on 'SUBSCRIBED'

      return () => {
        // Set mounted ref to false to avoid state updates after unmount
        mountedRef.current = false;

        // clearInterval(pollingInterval); // REMOVED POLLING
        // Add null check for supabaseRef.current
        if (supabaseRef.current && channelRef.current) {
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
    } catch (err) {
      console.error('Error in notification bell setup:', err);
      setError('Failed to initialize notifications');
    }
  }, [authLoading, user, profile]);

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
    if (DEBUG_REALTIME)
      console.log('NotificationBell: No user - hiding component');
    return null;
  }

  if (DEBUG_REALTIME) {
    console.log(
      'NotificationBell: Rendering for user',
      user?.email || 'cached admin',
    );
  }

  // Always show the bell for cached admins, otherwise check profile
  const isAdminOrSales =
    cachedIsAdmin || profile?.role === 'admin' || profile?.role === 'sales';

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
            <BellRing
              className={cn(
                'h-5 w-5',
                animateBell && 'animate-pulse text-yellow-500',
              )}
            />
          ) : (
            <Bell className="h-5 w-5" />
          )}
          {unreadCount > 0 && (
            <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0">
              {unreadCount}
            </Badge>
          )}
          <span className="absolute -bottom-1 -right-1 h-2 w-2 rounded-full bg-green-500 animate-pulse" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        {error ? (
          <DropdownMenuItem className="text-red-500">
            Failed to load notifications: {error}
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
