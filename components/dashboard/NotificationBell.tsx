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
  display_id?: string | null; // Add display_id field
  total_amount?: number; // Add total_amount field
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
  const [soundEnabled, setSoundEnabled] = useState(() => {
    try {
      const saved = localStorage.getItem('notification_sound');
      return saved !== null ? saved === 'true' : true;
    } catch (e) {
      return true;
    }
  });
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
    if (!soundEnabled) return;

    try {
      // Initialize audio element if it doesn't exist
      if (!audioRef.current) {
        console.log('Creating new Audio element for notification sound');
        audioRef.current = new Audio('/sound/notification.mp3');
        audioRef.current.preload = 'auto';
      }

      // Reset to beginning and play
      audioRef.current.currentTime = 0;
      const playPromise = audioRef.current.play();

      if (playPromise !== undefined) {
        playPromise.catch(err => {
          console.warn('Audio play failed:', err);
          // Create new instance as fallback
          const fallbackAudio = new Audio('/sound/notification.mp3');
          fallbackAudio
            .play()
            .catch(e => console.warn('Fallback audio failed:', e));
        });
      }
    } catch (err) {
      console.warn('Notification sound error:', err);
    }
  }, [soundEnabled]);

  const toggleSound = useCallback(() => {
    setSoundEnabled(prev => {
      const newValue = !prev;
      try {
        localStorage.setItem('notification_sound', newValue.toString());
      } catch (e) {
        console.warn('Failed to save sound preference:', e);
      }
      return newValue;
    });
  }, []);

  const handleFetchNotifications = useCallback(async () => {
    if (!supabaseRef.current || !mountedRef.current) return;

    setIsLoading(true);
    try {
      console.log('Fetching pending orders for notifications...');
      const { data, error } = await supabaseRef.current
        .from('orders')
        .select('id, display_id, status, created_at, total_amount, profiles(*)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      if (mountedRef.current) {
        console.log(`Found ${data.length} pending orders`);
        setNotifications(data as NotificationOrder[]);
        setUnreadCount(data.length);
        setError(null);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
      if (mountedRef.current) {
        setError('Failed to load notifications');
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  const setupRealtimeSubscription = useCallback(() => {
    try {
      if (!supabaseRef.current) {
        console.warn('Supabase client not initialized');
        return;
      }

      // Remove existing channel if it exists
      if (channelRef.current) {
        try {
          console.log('Removing existing realtime channel');
          supabaseRef.current.removeChannel(channelRef.current);
        } catch (err) {
          console.warn('Error removing existing channel:', err);
        }
      }

      console.log('Setting up new realtime subscription for pending orders');
      const channelName = 'orders-notifications-' + Date.now();

      const channel = supabaseRef.current
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'orders',
            filter: 'status=eq.pending',
          },
          (payload: RealtimePostgresChangesPayload<NotificationOrder>) => {
            // Safe access to payload properties
            const orderId =
              typeof payload.new === 'object' &&
              payload.new &&
              'id' in payload.new
                ? payload.new.id
                : typeof payload.old === 'object' &&
                  payload.old &&
                  'id' in payload.old
                ? payload.old.id
                : 'unknown';

            console.log(
              'Realtime notification received:',
              payload.eventType,
              orderId,
            );

            // Refresh notifications list
            handleFetchNotifications();

            // Animate bell and play sound
            setAnimateBell(true);
            playNotificationSound();
            setTimeout(() => setAnimateBell(false), 2000);
          },
        )
        .subscribe(status => {
          console.log(`Realtime subscription status: ${status}`);
          setConnectionStatus(status);
          if (status === 'SUBSCRIBED') {
            console.log('Successfully subscribed to order notifications');
            // Fetch initial data when subscription is established
            handleFetchNotifications();
          }
        });

      channelRef.current = channel;
    } catch (err) {
      console.error('Error setting up realtime subscription:', err);
    }
  }, [playNotificationSound, handleFetchNotifications]);

  useEffect(() => {
    try {
      mountedRef.current = true;

      if (authLoading) {
        console.log('Auth is still loading');
        return;
      }

      // Create a new client
      const client = createClient();
      supabaseRef.current = client;

      console.log('NotificationBell mounted, initializing...');

      if (!user && process.env.NODE_ENV !== 'development') {
        console.log('No authenticated user found');
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
      // Call setupRealtimeSubscription here

      setupRealtimeSubscription();

      // Store timeout ref in a local variable for cleanup
      const timeoutRef = retryTimeoutRef.current;

      return () => {
        mountedRef.current = false;

        if (supabaseRef.current && channelRef.current) {
          try {
            supabaseRef.current.removeChannel(channelRef.current);
          } catch (err) {
            console.warn('Error removing channel:', err);
          }
        }
        if (timeoutRef) {
          clearTimeout(timeoutRef);
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
    handleFetchNotifications,
  ]);

  const handleNotificationClick = (orderId: string) => {
    router.push(`/dashboard/orders/${orderId}`);
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  return (
    <>
      {/* Hidden audio element for notifications */}
      <audio src="/sound/notification.mp3" ref={audioRef} preload="auto" />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="relative w-10 h-10 bg-yellow-50 hover:bg-yellow-100 border border-yellow-200 rounded-full"
            disabled={isLoading}
          >
            <div className={cn(animateBell && 'animate-bell')}>
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
                <VolumeX className="absolute bottom-0 right-0 h-3 w-3 text-gray-500" />
              )}
            </div>

            {/* Fixed badge implementation */}
            {unreadCount > 0 && (
              <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-red-500 text-white border-2 border-background animate-pulse">
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}

            {/* Connection status indicator */}
            <span
              className={`absolute -bottom-1 -right-1 h-2 w-2 rounded-full ${
                connectionStatus === 'SUBSCRIBED'
                  ? 'bg-green-500'
                  : 'bg-yellow-500'
              }`}
            />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-64 p-2">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-sm">Pending Orders</h4>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSound}
              className="h-6 w-6"
              title={
                soundEnabled
                  ? 'Mute notifications'
                  : 'Enable notification sounds'
              }
            >
              {soundEnabled ? (
                <Volume2 className="h-4 w-4" />
              ) : (
                <VolumeX className="h-4 w-4" />
              )}
            </Button>
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
                      <div className="text-xs font-medium">
                        {notification.display_id ||
                          `Order #${notification.id.slice(0, 8)}`}
                      </div>
                      {notification.total_amount && (
                        <div className="text-xs text-muted-foreground">
                          ETB {notification.total_amount.toFixed(2)}
                        </div>
                      )}
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
    </>
  );
}
