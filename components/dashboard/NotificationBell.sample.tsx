import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Bell, BellRing, Volume2, VolumeX } from 'lucide-react';
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
import { useAuth } from '@/hooks/useAuth';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
// Import types and functions from the actions file
import { 
  NotificationOrder, 
  fetchPendingOrdersForNotification,
  isOrderPending 
} from '@/app/actions/notificationBellActions';

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
  const { user } = useAuth();

  // Audio reference for notification sounds
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const supabaseRef = useRef<SupabaseClient<Database> | null>(null);
  const mountedRef = useRef(true); // Track component mount state

  // Play notification sound
  const playNotificationSound = useCallback(async () => {
    if (!soundEnabled) return;

    try {
      // Initialize audio element if it doesn't exist
      if (!audioRef.current) {
        audioRef.current = new Audio('/sound/notification.mp3');
        audioRef.current.preload = 'auto';
      }

      // Reset to beginning and play
      audioRef.current.currentTime = 0;
      await audioRef.current.play();
    } catch (err) {
      console.warn('Notification sound error:', err);
    }
  }, [soundEnabled]);

  // Toggle sound setting
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

  // Fetch pending orders
  const fetchPendingOrders = useCallback(async () => {
    if (!mountedRef.current) return;
    
    setIsLoading(true);
    try {
      // Use the server action to fetch pending orders
      const response = await fetchPendingOrdersForNotification(user?.id);
      
      if (!response.success) {
        setError(response.error || 'Failed to load orders');
        setNotifications([]);
        setUnreadCount(0);
        return;
      }
      
      if (mountedRef.current) {
        setNotifications(response.orders);
        setUnreadCount(response.count);
        setError(null);
      }
    } catch (err) {
      if (mountedRef.current) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(`Failed to load notifications: ${errorMessage}`);
        setNotifications([]);
        setUnreadCount(0);
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [user]);

  // Setup realtime subscription
  const setupRealtimeSubscription = useCallback(() => {
    try {
      // Initialize Supabase client if needed
      if (!supabaseRef.current) {
        supabaseRef.current = createClient();
      }

      // Remove existing channel if it exists
      if (channelRef.current) {
        try {
          supabaseRef.current.removeChannel(channelRef.current);
        } catch (err) {
          console.warn('Error removing existing channel:', err);
        }
      }

      // Create a unique channel name
      const channelName = 'orders-notifications-' + Date.now();

      // Set up the channel
      const channel = supabaseRef.current
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'orders',
            // Filter by customer_profile_id if user is authenticated
            ...(user?.id ? { filter: `customer_profile_id=eq.${user.id}` } : {}),
          },
          (payload: RealtimePostgresChangesPayload<NotificationOrder>) => {
            // Get the order ID from the payload
            const orderId = 
              typeof payload.new === 'object' && payload.new && 'id' in payload.new
                ? payload.new.id
                : typeof payload.old === 'object' && payload.old && 'id' in payload.old
                ? payload.old.id
                : 'unknown';

            // Check if this is a pending order
            const isPending = (() => {
              if (
                typeof payload.new !== 'object' ||
                !payload.new ||
                !('status' in payload.new)
              ) {
                return false;
              }
              
              return isOrderPending(payload.new.status);
            })();

            // Always refresh notifications list to keep it up to date
            fetchPendingOrders();

            // Only animate and play sound for new pending orders
            if (
              isPending &&
              (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE')
            ) {
              setAnimateBell(true);
              playNotificationSound();
              setTimeout(() => setAnimateBell(false), 2000);
            }
          },
        )
        .subscribe(status => {
          setConnectionStatus(status);
          if (status === 'SUBSCRIBED') {
            // Fetch initial data when subscription is established
            fetchPendingOrders();
          }
        });

      channelRef.current = channel;
    } catch (err) {
      console.error('Error setting up realtime subscription:', err);
      setError('Failed to set up realtime updates');
    }
  }, [user, playNotificationSound, fetchPendingOrders]);

  // Initialize component
  useEffect(() => {
    mountedRef.current = true;

    // Create Supabase client
    try {
      const client = createClient();
      supabaseRef.current = client;
    } catch (err) {
      setError('Failed to initialize notification system');
      return;
    }

    // Setup realtime subscription
    setupRealtimeSubscription();

    // Cleanup on unmount
    return () => {
      mountedRef.current = false;

      if (supabaseRef.current && channelRef.current) {
        try {
          supabaseRef.current.removeChannel(channelRef.current);
        } catch (err) {
          console.warn('Error removing channel:', err);
        }
      }
    };
  }, [setupRealtimeSubscription]);

  // Handle notification click
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
            className="relative w-10 h-10 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-full shadow-sm transition-all duration-200 hover:shadow"
            disabled={isLoading}
          >
            <div className={cn(animateBell && 'animate-bell')}>
              {animateBell ? (
                <BellRing className="h-6 w-6 text-red-500 animate-bell" />
              ) : (
                <Bell
                  className={cn(
                    'h-6 w-6',
                    unreadCount > 0 ? 'text-red-500' : 'text-amber-600',
                  )}
                />
              )}
              {!soundEnabled && (
                <VolumeX className="absolute bottom-0 right-0 h-3 w-3 text-gray-500" />
              )}
            </div>

            {/* Badge for unread count */}
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
            <h4 className="font-semibold text-sm">
              Pending Orders
              <span className="text-xs font-normal text-gray-500 ml-1">
                ({notifications.length})
              </span>
            </h4>
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
            <div className="p-3 text-red-600 bg-red-50 rounded-md mb-1 border border-red-200 shadow-sm">
              <div className="font-medium flex items-center gap-1">
                <span>⚠️</span>
                <span>Error Loading Notifications</span>
              </div>
              <div className="text-sm mt-1">{error}</div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground bg-amber-50 rounded-md border border-amber-200">
              <div className="mb-2 text-2xl">📭</div>
              <div className="font-medium text-amber-800">
                No pending orders
              </div>
              <div className="text-xs mt-2 text-amber-600">
                Notifications will appear here when new orders arrive
              </div>
            </div>
          ) : (
            <div className="max-h-[300px] overflow-y-auto">
              {notifications.map(notification => (
                <DropdownMenuItem
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification.id)}
                  className="cursor-pointer mb-1 hover:bg-yellow-50 rounded-md transition-colors duration-200 border border-transparent hover:border-yellow-200"
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
            {/* Sound controls */}
            <div className="flex items-center justify-between mb-2">
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
                  onClick={() => playNotificationSound()}
                  title="Test notification sound"
                >
                  Test
                </Button>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-between mt-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={fetchPendingOrders}
                title="Manually refresh pending orders"
              >
                Refresh
              </Button>

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
