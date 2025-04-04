import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Bell, BellRing, Volume2, VolumeX } from 'lucide-react';
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
  const [soundEnabled, setSoundEnabled] = useState(true); // Default to enabled
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

  // Function to check if a sound file exists
  const checkSoundFileExists = async (url: string): Promise<boolean> => {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch (err) {
      console.warn(`Failed to check if sound file exists at ${url}:`, err);
      return false;
    }
  };

  // Play notification sound with multiple fallback options
  const playNotificationSound = async () => {
    // Only play sound if enabled
    if (!soundEnabled) {
      if (DEBUG_REALTIME)
        console.log('Sound disabled, skipping notification sound');
      return;
    }

    try {
      // If we don't have an audio element yet, create one
      if (!audioRef.current) {
        // Try different paths in order of preference
        const soundPaths = [
          '/sound/notification.mp3',
          '/sounds/notification.mp3',
          '/notification.mp3',
          '/assets/notification.mp3',
          '/assets/sounds/notification.mp3',
        ];

        // Find the first path that exists
        for (const path of soundPaths) {
          if (await checkSoundFileExists(path)) {
            if (DEBUG_REALTIME) console.log(`Found sound file at ${path}`);
            audioRef.current = new Audio(path);
            break;
          }
        }

        // If no path worked, use the first one anyway and hope for the best
        if (!audioRef.current) {
          console.warn(
            'Could not find notification sound file, using default path',
          );
          audioRef.current = new Audio('/sound/notification.mp3');
        }
      }

      // Play the sound
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(e => {
        console.warn('Audio play failed:', e);
        // If play fails due to user interaction requirements, we'll just skip it
        // This happens in browsers that require user interaction before playing audio
      });
    } catch (err) {
      console.warn('Notification sound error:', err);
    }
  };

  // Toggle sound settings and save to localStorage
  const toggleSound = useCallback(() => {
    const newSoundEnabled = !soundEnabled;
    setSoundEnabled(newSoundEnabled);

    // Save preference to localStorage
    try {
      localStorage.setItem(
        'notification_sound_enabled',
        newSoundEnabled ? 'true' : 'false',
      );
      if (DEBUG_REALTIME)
        console.log(
          `Sound ${
            newSoundEnabled ? 'enabled' : 'disabled'
          } and saved to localStorage`,
        );
    } catch (err) {
      console.warn('Failed to save sound preference to localStorage:', err);
    }

    // Play a test sound if enabled
    if (newSoundEnabled) {
      playNotificationSound().catch(err =>
        console.warn('Failed to play test notification sound:', err),
      );
    }
  }, [soundEnabled, playNotificationSound]);

  // Load sound preference from localStorage on mount
  useEffect(() => {
    try {
      const savedPreference = localStorage.getItem(
        'notification_sound_enabled',
      );
      if (savedPreference !== null) {
        const isEnabled = savedPreference === 'true';
        setSoundEnabled(isEnabled);
        if (DEBUG_REALTIME)
          console.log(
            `Loaded sound preference from localStorage: ${
              isEnabled ? 'enabled' : 'disabled'
            }`,
          );
      }
    } catch (err) {
      console.warn('Failed to load sound preference from localStorage:', err);
    }
  }, []);

  // Enhanced animation effect for the bell
  useEffect(() => {
    if (!animateBell) return;

    // Animate for longer (3 seconds) with a more noticeable effect
    const timer = setTimeout(() => setAnimateBell(false), 3000);
    return () => clearTimeout(timer);
  }, [animateBell]);

  const fetchNotifications = useCallback(async () => {
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

      const client = supabaseRef.current;
      // Add null check for client
      if (!client) {
        console.error('Client not initialized in fetchNotifications');
        setError('Client not available');
        setIsLoading(false);
        return;
      }

      if (DEBUG_REALTIME) console.log('Fetching notification data...');

      // Add console log to debug the query
      console.log('Fetching pending orders with query:', {
        table: 'orders',
        status: 'pending',
        userId: user?.id,
        role: profile?.role,
      });

      const { data, error, count } = await client
        .from('orders')
        .select('id, status, created_at, profiles!orders_profile_id_fkey(*)', {
          count: 'exact',
        })
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(10);

      // Log the result
      console.log('Pending orders query result:', {
        success: !error,
        count,
        dataLength: data?.length || 0,
        error: error?.message,
      });

      if (error) {
        console.error('Database fetch error:', error);
        throw new Error(error.message || 'Failed to fetch orders');
      }

      // Skip state update if component is unmounted
      if (!mountedRef.current) return;

      const actualCount = typeof count === 'number' ? count : 0;

      if (DEBUG_REALTIME) {
        console.log(
          `fetchNotifications: Received count = ${actualCount}, data length = ${
            data?.length ?? 0
          }`,
        );
      }

      // Filter out null created_at and map to NotificationOrder type
      const pendingOrders = (data || [])
        .filter((order: any) => order?.created_at && order.status === 'pending')
        .map(
          (order: any): NotificationOrder => ({
            // Ensure correct type mapping
            id: order.id,
            status: order.status,
            created_at: order.created_at as string, // Already filtered non-null
            profiles: order.profiles,
          }),
        );

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

      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to fetch notifications';
      setError(errorMessage);
      console.error('Initial Notification fetch error:', error);

      // Retry logic specifically for initial fetch
      if (retryCountRef.current < MAX_RETRIES) {
        retryCountRef.current += 1;
        const backoffTime = Math.min(
          1000 * Math.pow(2, retryCountRef.current),
          10000,
        );
        console.log(
          `Retrying initial fetch in ${backoffTime}ms (Attempt ${retryCountRef.current})`,
        );
        if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = setTimeout(() => {
          if (mountedRef.current) {
            fetchNotifications(); // Retry initial fetch
          }
        }, backoffTime);
      } else {
        console.error(
          `Max retries (${MAX_RETRIES}) reached for initial notification fetch.`,
        );
        setError(
          `Failed to load notifications after ${MAX_RETRIES} attempts. ${errorMessage}`,
        );
      }
    } finally {
      // Skip state updates if component unmounted
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [user, profile, playNotificationSound]);

  const setupRealtimeSubscription = useCallback((): void => {
    // Exit if component unmounted
    if (!mountedRef.current) return;

    try {
      const client = supabaseRef.current;
      // Add null check for client
      if (!client) {
        console.error('Client not initialized in setupRealtimeSubscription');
        setError('Client not available');
        return;
      }

      // Remove existing channel if it exists
      if (channelRef.current) {
        try {
          client.removeChannel(channelRef.current);
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
      console.log('Setting up realtime channel:', channelName);

      const channel = client
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'orders',
            filter: 'status=eq.pending', // Add filter back to focus on pending orders
          },
          (payload: RealtimePostgresChangesPayload<any>) => {
            // Add type to payload
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
            const createNotification = (
              record: any,
            ): NotificationOrder | null => {
              if (!record || !record.created_at || !record.id || !record.status)
                return null;
              return {
                id: record.id,
                status: record.status,
                created_at: record.created_at as string,
                profiles: record.profiles, // Assuming profiles are included in the payload if selected
              };
            };

            if (payload.eventType === 'INSERT') {
              if (newRecord?.status === 'pending') {
                // Always log new pending orders for debugging
                console.log('🔔 NEW PENDING ORDER RECEIVED:', newRecord);

                const newNotification = createNotification(newRecord);
                if (newNotification) {
                  console.log(
                    '🔔 Adding notification to list:',
                    newNotification,
                  );

                  // Update notifications list
                  setNotifications(prev => [
                    newNotification,
                    ...prev.slice(0, 9),
                  ]); // Add to start, limit to 10

                  // Increment unread count
                  setUnreadCount(prev => {
                    const newCount = prev + 1;
                    console.log(
                      `🔔 Unread count updated: ${prev} -> ${newCount}`,
                    );
                    return newCount;
                  });

                  // Animate bell and play sound
                  setAnimateBell(true);
                  playNotificationSound().catch(err =>
                    console.warn('Failed to play notification sound:', err),
                  );
                }
              }
            } else if (payload.eventType === 'UPDATE') {
              const oldStatus = oldRecord?.status;
              const newStatus = newRecord?.status;

              if (oldStatus !== 'pending' && newStatus === 'pending') {
                // Became pending
                const newNotification = createNotification(newRecord);
                if (newNotification) {
                  if (DEBUG_REALTIME)
                    console.log('UPDATE to pending:', newNotification);
                  setNotifications(prev => [
                    newNotification,
                    ...prev
                      .filter(n => n.id !== newNotification.id)
                      .slice(0, 9),
                  ]);
                  setUnreadCount(prev => prev + 1);
                  setAnimateBell(true);
                  playNotificationSound().catch(err =>
                    console.warn('Failed to play notification sound:', err),
                  );
                }
              } else if (oldStatus === 'pending' && newStatus !== 'pending') {
                // No longer pending
                if (DEBUG_REALTIME)
                  console.log('UPDATE from pending:', oldRecord);
                setNotifications(prev =>
                  prev.filter(n => n.id !== oldRecord.id),
                );
                setUnreadCount(prev => Math.max(0, prev - 1));
              } else if (oldStatus === 'pending' && newStatus === 'pending') {
                // Still pending, update details if necessary (e.g., profile info)
                const updatedNotification = createNotification(newRecord);
                if (updatedNotification) {
                  if (DEBUG_REALTIME)
                    console.log('UPDATE still pending:', updatedNotification);
                  setNotifications(prev =>
                    prev.map(n =>
                      n.id === updatedNotification.id ? updatedNotification : n,
                    ),
                  );
                  // Do NOT change unread count or animate/sound here
                }
              }
            } else if (payload.eventType === 'DELETE') {
              if (oldRecord?.status === 'pending') {
                // Deleted while pending
                if (DEBUG_REALTIME) console.log('DELETE pending:', oldRecord);
                setNotifications(prev =>
                  prev.filter(n => n.id !== oldRecord.id),
                );
                setUnreadCount(prev => Math.max(0, prev - 1));
              }
            }
          },
        )
        .subscribe(status => {
          if (!mountedRef.current) return;

          // Always log the channel status for debugging
          console.log(`Notification Bell - Channel status: ${status}`);

          setConnectionStatus(status);

          if (DEBUG_REALTIME) {
            console.log(
              `Realtime ${channelName} status:`,
              status,
              new Date().toISOString(),
            );
          }

          if (status === 'SUBSCRIBED') {
            console.log(
              'Notification Bell - Successfully subscribed, refreshing data...',
            );
            // Fetch initial notifications upon successful subscription
            fetchNotifications(); // Fetch initial state
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.error(
              `Notification Bell - Channel error or timed out (${status}), will retry`,
            );
            if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
            retryTimeoutRef.current = setTimeout(() => {
              if (mountedRef.current) {
                console.log('Notification Bell - Attempting to reconnect...');
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
  }, [user, profile, playNotificationSound, fetchNotifications]);

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
  }; // Add missing closing parenthesis

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
  }, [authLoading, user, profile, setupRealtimeSubscription]);

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
        <span className="absolute -bottom-1 -right-1 h-2 w-2 rounded-full bg-gray-300 animate-pulse" />
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

  // For debugging - log the profile role
  console.log('NotificationBell: User profile role:', profile?.role);
  console.log('NotificationBell: cachedIsAdmin:', cachedIsAdmin);
  console.log('NotificationBell: isAdminOrSales:', isAdminOrSales);

  // Always show the bell in development mode for testing
  if (process.env.NODE_ENV === 'development') {
    // Continue rendering even if not admin/sales in development
  } else if (!isAdminOrSales) {
    // In production, still respect the role check
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative bg-yellow-50 hover:bg-yellow-100 border border-yellow-200"
          disabled={isLoading}
        >
          <div
            className={cn(animateBell && 'animate-bell')}
            title={
              soundEnabled
                ? 'Notification sounds on'
                : 'Notification sounds off'
            }
          >
            {animateBell ? (
              <BellRing className={cn('h-6 w-6', 'text-yellow-500')} />
            ) : (
              <Bell
                className={cn(
                  'h-6 w-6',
                  unreadCount > 0 && 'text-red-500',
                  !soundEnabled && 'opacity-70',
                )}
              />
            )}
            {!soundEnabled && (
              <div className="absolute bottom-0 right-0 h-2 w-2 bg-gray-400 rounded-full border border-background"></div>
            )}
          </div>
          {unreadCount > 0 && (
            <Badge
              className="absolute -right-1 -top-1 h-7 w-7 rounded-full p-0 flex items-center justify-center bg-red-500 text-white border-2 border-background animate-pulse"
              style={{ fontSize: '0.85rem', fontWeight: 'bold' }}
            >
              {unreadCount}
            </Badge>
          )}
          {connectionStatus === 'SUBSCRIBED' && (
            <span className="absolute -bottom-1 -right-1 h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-2">
        <div className="flex items-center justify-between mb-2 px-2">
          <h4 className="font-semibold text-sm">Notifications</h4>
          {connectionStatus === 'SUBSCRIBED' ? (
            <div className="flex items-center text-xs text-green-600">
              <span className="h-2 w-2 rounded-full bg-green-500 mr-1"></span>
              Live
            </div>
          ) : (
            <div className="flex items-center text-xs text-yellow-600">
              <span className="h-2 w-2 rounded-full bg-yellow-500 mr-1"></span>
              Connecting...
            </div>
          )}
        </div>

        {error ? (
          <div className="p-3 text-red-500 bg-red-50 rounded-md mb-1">
            <div className="font-medium">Error</div>
            <div className="text-sm">{error}</div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            <div className="mb-2">📭</div>
            <div>No pending orders</div>
          </div>
        ) : (
          <div className="max-h-[300px] overflow-y-auto">
            {notifications.map(notification => (
              <DropdownMenuItem
                key={notification.id}
                onClick={() => handleNotificationClick(notification.id)}
                className="cursor-pointer mb-1 hover:bg-muted rounded-md"
              >
                <div className="flex items-start gap-2 w-full">
                  <div className="bg-yellow-100 text-yellow-800 p-2 rounded-full">
                    <BellRing className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col flex-1">
                    <div className="flex justify-between items-center w-full">
                      <span className="font-medium">
                        New {notification.status} order
                      </span>
                      <Badge variant="outline" className="ml-2 text-xs">
                        Pending
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(notification.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
          </div>
        )}

        <div className="mt-2 pt-2 border-t border-muted">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-1 text-xs"
                onClick={toggleSound}
              >
                {soundEnabled ? (
                  <>
                    <Volume2 className="h-3 w-3" />
                    <span>Sound On</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="h-3 w-3" />
                    <span>Sound Off</span>
                  </>
                )}
              </Button>

              {soundEnabled && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  onClick={() =>
                    playNotificationSound().catch(err =>
                      console.warn('Failed to play test sound:', err),
                    )
                  }
                  title="Test notification sound"
                >
                  Test
                </Button>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => router.push('/dashboard/orders')}
            >
              View All Orders
            </Button>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
