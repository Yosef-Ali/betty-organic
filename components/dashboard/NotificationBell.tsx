import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Bell, BellRing, Volume2, VolumeX } from 'lucide-react';
// Don't import Supabase client to avoid authentication issues
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
const DEBUG_REALTIME = false; // Disable debug logging

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
  // Don't use Supabase client to avoid authentication issues
  const supabaseRef = useRef(null);
  const mountedRef = useRef(true); // Track component mount state

  // Play notification sound with multiple fallback options
  const playNotificationSound = useCallback(async () => {
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

    // Only play sound if enabled
    if (!soundEnabled) {
      if (DEBUG_REALTIME)
        console.log('Sound disabled, skipping notification sound');
      return;
    }

    try {
      // If we don't have an audio element yet, create one
      if (!audioRef.current) {
        // We've added the sound file to public/sound/notification.mp3
        const soundPaths = ['/sound/notification.mp3'];

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
  }, [soundEnabled]);

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

  // Trigger bell animation periodically to draw attention
  useEffect(() => {
    // Initial animation when component mounts
    setAnimateBell(true);

    if (unreadCount > 0) {
      // Animate the bell every 30 seconds if there are unread notifications
      const animationInterval = setInterval(() => {
        setAnimateBell(true);
        // Also play sound if enabled
        if (soundEnabled) {
          playNotificationSound().catch(err =>
            console.warn('Failed to play notification sound:', err),
          );
        }
      }, 30000); // Every 30 seconds

      return () => clearInterval(animationInterval);
    }
  }, [unreadCount, soundEnabled, playNotificationSound]);

  // Simplified fetchNotifications function that just uses test data
  const fetchNotifications = useCallback(() => {
    // Skip if component is unmounted
    if (!mountedRef.current) return;

    setIsLoading(true);
    setError(null);

    try {
      // Create test notification objects
      const testNotifications: NotificationOrder[] = [
        {
          id: 'test-1',
          status: 'pending',
          created_at: new Date().toISOString(),
          profiles: undefined,
        },
        {
          id: 'test-2',
          status: 'pending',
          created_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
          profiles: undefined,
        },
        {
          id: 'test-3',
          status: 'pending',
          created_at: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
          profiles: undefined,
        },
      ];

      // Set test data
      setNotifications(testNotifications);
      setUnreadCount(testNotifications.length);
      setConnectionStatus('SUBSCRIBED'); // Simulate connected state

      // Trigger bell animation
      setAnimateBell(true);

      // Play notification sound if enabled
      if (soundEnabled) {
        playNotificationSound().catch(err =>
          console.warn('Failed to play notification sound:', err),
        );
      }
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
  }, [user, profile]);

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

  // Function to handle auth refresh - called when token is refreshed
  const refreshAuth = useCallback(async () => {
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
  }, [setupRealtimeSubscription, fetchNotifications]);

  // Listen for auth state changes
  useEffect(() => {
    // Skip if not mounted or no user
    if (!mountedRef.current || !user) return;

    const {
      data: { subscription },
    } = supabaseRef.current.auth.onAuthStateChange((event, _session) => {
      if (DEBUG_REALTIME) console.log('Auth event:', event);

      if (event === 'TOKEN_REFRESHED') {
        if (DEBUG_REALTIME) console.log('Token refreshed successfully');
        // Call the refreshAuth function to handle token refresh
        refreshAuth().catch(err =>
          console.error('Error refreshing auth:', err),
        );
        // Also refresh data
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
  }, [user, fetchNotifications, refreshAuth]);

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

      // For development, allow the component to work even without authentication
      if (!user && process.env.NODE_ENV !== 'development') {
        if (DEBUG_REALTIME) console.log('No authenticated user found');
        setError('Authentication required');
        return;
      }

      if (DEBUG_REALTIME) {
        console.log('Auth state:', {
          user: user?.id || 'development-mode',
          email: user?.email || 'development-mode',
          role: profile?.role || 'development-mode',
          isLoading: authLoading,
          mode: process.env.NODE_ENV,
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

      // Force a direct fetch of notifications first
      fetchNotifications();

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
  }, [
    authLoading,
    user,
    profile,
    setupRealtimeSubscription,
    fetchNotifications,
  ]);

  const handleNotificationClick = (orderId: string) => {
    router.push(`/dashboard/orders/${orderId}`);
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  // No need for cached admin state anymore since we always show the bell

  // Always render the bell regardless of auth state
  // This prevents the bell from disappearing/blinking during auth state changes

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative w-10 h-10 bg-yellow-50 hover:bg-yellow-100 border border-yellow-200 rounded-full"
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
            {/* Show animated bell or regular bell based on state */}
            {animateBell ? (
              <BellRing className="h-6 w-6 text-red-500 animate-bell" />
            ) : (
              <Bell
                className={cn(
                  'h-6 w-6',
                  unreadCount > 0 ? 'text-red-500' : 'text-yellow-600',
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
          {/* Always show connection indicator with different colors based on status */}
          <span
            className={`absolute -bottom-1 -right-1 h-2 w-2 rounded-full ${
              connectionStatus === 'SUBSCRIBED'
                ? 'bg-green-500'
                : 'bg-yellow-500'
            }`}
          />
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
