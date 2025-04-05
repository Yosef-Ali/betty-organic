import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Bell, BellRing, Volume2, VolumeX } from 'lucide-react';
// Import the Supabase client to handle real-time updates properly
import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
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
// No longer using ExtendedOrder directly
import { useAuth } from '@/hooks/useAuth';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'; // Import payload type
import type { Database } from '@/types/supabase';

const MAX_RETRIES = 3; // Max retries for initial fetch
const RECONNECT_INTERVAL = 5000; // 5 seconds for connection retries
const DEBUG_REALTIME = false; // Disable debug logging

type NotificationOrder = {
  id: string;
  status: string;
  created_at: string; // Ensure created_at is not null
  profiles?: {
    id: string;
    name: string | null;
    email: string;
    role: string;
    phone?: string | null;
    avatar_url?: string | null;
  } | null;
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
  const channelRef = useRef<RealtimeChannel | null>(null);
  const supabaseRef = useRef<SupabaseClient<Database> | null>(null);
  const mountedRef = useRef(true); // Track component mount state

  // Play notification sound with multiple fallback options
  const playNotificationSound = useCallback(async () => {
    const checkSoundFileExists = async (url: string): Promise<boolean> => {
      try {
        const response = await fetch(url, { method: 'HEAD' });
        return response.ok;
      } catch (err) {
        console.warn(`Failed to check if sound file exists at ${url}:`, err);
        return false;
      }
    };

    if (!soundEnabled) {
      if (DEBUG_REALTIME)
        console.log('Sound disabled, skipping notification sound');
      return;
    }

    try {
      if (!audioRef.current) {
        const soundPaths = ['/sound/notification.mp3'];

        for (const path of soundPaths) {
          if (await checkSoundFileExists(path)) {
            if (DEBUG_REALTIME) console.log(`Found sound file at ${path}`);
            audioRef.current = new Audio(path);
            break;
          }
        }

        if (!audioRef.current) {
          console.warn(
            'Could not find notification sound file, using default path',
          );
          audioRef.current = new Audio('/sound/notification.mp3');
        }
      }

      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(e => {
        console.warn('Audio play failed:', e);
      });
    } catch (err) {
      console.warn('Notification sound error:', err);
    }
  }, [soundEnabled]);

  const toggleSound = useCallback(() => {
    const newSoundEnabled = !soundEnabled;
    setSoundEnabled(newSoundEnabled);

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

    if (newSoundEnabled) {
      playNotificationSound().catch(err =>
        console.warn('Failed to play test notification sound:', err),
      );
    }
  }, [soundEnabled, playNotificationSound]);

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

  useEffect(() => {
    if (!animateBell) return;

    const timer = setTimeout(() => setAnimateBell(false), 3000);
    return () => clearTimeout(timer);
  }, [animateBell]);

  useEffect(() => {
    setAnimateBell(true);

    if (unreadCount > 0) {
      const animationInterval = setInterval(() => {
        setAnimateBell(true);
        if (soundEnabled) {
          playNotificationSound().catch(err =>
            console.warn('Failed to play notification sound:', err),
          );
        }
      }, 30000);

      return () => clearInterval(animationInterval);
    }
  }, [unreadCount, soundEnabled, playNotificationSound]);

  const fetchNotifications = useCallback(async () => {
    if (!mountedRef.current) return;

    setIsLoading(true);
    setError(null);

    try {
      if (!supabaseRef.current) {
        supabaseRef.current = createClient();
      }

      const client = supabaseRef.current;
      if (!client) {
        throw new Error('Failed to initialize Supabase client');
      }

      const { data: pendingOrders, error } = await client
        .from('orders')
        .select(
          'id, status, created_at, customer_profile_id, customer:customer_profile_id(id, name, email, role, phone, avatar_url)',
        )
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      const formattedNotifications: NotificationOrder[] = (
        pendingOrders || []
      ).map((order: any) => ({
        id: order.id,
        status: order.status,
        created_at: order.created_at || new Date().toISOString(),
        profiles: order.customer || null,
      }));

      setNotifications(formattedNotifications);
      setUnreadCount(formattedNotifications.length);
      setConnectionStatus('SUBSCRIBED');

      if (formattedNotifications.length > 0) {
        setAnimateBell(true);

        if (soundEnabled) {
          playNotificationSound().catch(err =>
            console.warn('Failed to play notification sound:', err),
          );
        }
      }
    } catch (error) {
      if (!mountedRef.current) return;

      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to fetch notifications';
      setError(errorMessage);
      console.error('Initial Notification fetch error:', error);

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
            fetchNotifications();
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
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [playNotificationSound, soundEnabled]);

  const setupRealtimeSubscription = useCallback((): void => {
    if (!mountedRef.current) return;

    try {
      const client = supabaseRef.current;
      if (!client) {
        console.error('Client not initialized in setupRealtimeSubscription');
        setError('Client not available');
        return;
      }

      if (channelRef.current) {
        try {
          client.removeChannel(channelRef.current);
        } catch (err) {
          console.warn('Error removing existing channel:', err);
        }
      }

      const channelName = 'order-status';

      if (DEBUG_REALTIME) {
        console.log('Setting up realtime subscription:', {
          channelName,
          userId: user?.id,
          role: profile?.role,
        });
      }

      console.log('Setting up realtime channel:', channelName);

      const channel = client
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'orders',
            filter: 'status=eq.pending',
          },
          (payload: RealtimePostgresChangesPayload<Record<string, any>>) => {
            if (!mountedRef.current) return;

            if (DEBUG_REALTIME) {
              console.log('Realtime Order change received:', {
                eventType: payload.eventType,
                new: payload.new,
                old: payload.old,
                timestamp: new Date().toISOString(),
              });
            }

            const newRecord = payload.new as Record<string, any>;
            const oldRecord = payload.old as Record<string, any>;

            const createNotification = (
              record: Record<string, any>,
            ): NotificationOrder | null => {
              if (!record || !record.created_at || !record.id || !record.status)
                return null;
              return {
                id: record.id,
                status: record.status,
                created_at: record.created_at as string,
                profiles: record.profiles,
              };
            };

            if (payload.eventType === 'INSERT') {
              if (newRecord?.status === 'pending') {
                console.log('🔔 NEW PENDING ORDER RECEIVED:', newRecord);

                const newNotification = createNotification(newRecord);
                if (newNotification) {
                  console.log(
                    '🔔 Adding notification to list:',
                    newNotification,
                  );

                  setNotifications(prev => [
                    newNotification,
                    ...prev.slice(0, 9),
                  ]);

                  setUnreadCount(prev => {
                    const newCount = prev + 1;
                    console.log(
                      `🔔 Unread count updated: ${prev} -> ${newCount}`,
                    );
                    return newCount;
                  });

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
                if (DEBUG_REALTIME)
                  console.log('UPDATE from pending:', oldRecord);
                setNotifications(prev =>
                  prev.filter(n => n.id !== oldRecord.id),
                );
                setUnreadCount(prev => Math.max(0, prev - 1));
              } else if (oldStatus === 'pending' && newStatus === 'pending') {
                const updatedNotification = createNotification(newRecord);
                if (updatedNotification) {
                  if (DEBUG_REALTIME)
                    console.log('UPDATE still pending:', updatedNotification);
                  setNotifications(prev =>
                    prev.map(n =>
                      n.id === updatedNotification.id ? updatedNotification : n,
                    ),
                  );
                }
              }
            } else if (payload.eventType === 'DELETE') {
              if (oldRecord?.status === 'pending') {
                if (DEBUG_REALTIME) console.log('DELETE pending:', oldRecord);
                setNotifications(prev =>
                  prev.filter(n => n.id !== oldRecord.id),
                );
                setUnreadCount(prev => Math.max(0, prev - 1));
              }
            }
          },
        )
        .subscribe((status: string) => {
          if (!mountedRef.current) return;

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
            fetchNotifications();
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

      if (!mountedRef.current) return;

      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }

      retryTimeoutRef.current = setTimeout(() => {
        if (mountedRef.current) {
          setupRealtimeSubscription();
        }
      }, RECONNECT_INTERVAL);
    }
  }, [user, profile, playNotificationSound, fetchNotifications]);

  const refreshAttemptRef = useRef(0);

  const refreshAuth = useCallback(async () => {
    try {
      if (refreshAttemptRef.current >= 3) return;

      refreshAttemptRef.current += 1;

      if (DEBUG_REALTIME)
        console.log('Attempting auth refresh', refreshAttemptRef.current);

      supabaseRef.current = createClient();

      setupRealtimeSubscription();

      fetchNotifications();
    } catch (err) {
      console.error('Auth refresh error:', err);
      setError('Authentication error. Please reload the page.');
    }
  }, [setupRealtimeSubscription, fetchNotifications]);

  useEffect(() => {
    if (!mountedRef.current || !user) return;

    if (!supabaseRef.current) {
      supabaseRef.current = createClient();
    }

    // Skip if supabaseRef is still null
    if (!supabaseRef.current) return;

    const {
      data: { subscription },
    } = supabaseRef.current.auth.onAuthStateChange((event, _session) => {
      if (DEBUG_REALTIME) console.log('Auth event:', event);

      if (event === 'TOKEN_REFRESHED') {
        if (DEBUG_REALTIME) console.log('Token refreshed successfully');
        refreshAuth().catch(err =>
          console.error('Error refreshing auth:', err),
        );
        fetchNotifications();
      } else if (event === 'SIGNED_OUT') {
        setNotifications([]);
        setUnreadCount(0);
      } else if (event === 'USER_UPDATED') {
        fetchNotifications();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [user, fetchNotifications, refreshAuth]);

  useEffect(() => {
    try {
      mountedRef.current = true;

      if (authLoading) {
        if (DEBUG_REALTIME) console.log('Auth is still loading');
        return;
      }

      supabaseRef.current = createClient();

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

      if (typeof localStorage !== 'undefined') {
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('supabase.realtime')) {
            localStorage.removeItem(key);
          }
        });
      }

      fetchNotifications();

      setupRealtimeSubscription();

      return () => {
        mountedRef.current = false;

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
