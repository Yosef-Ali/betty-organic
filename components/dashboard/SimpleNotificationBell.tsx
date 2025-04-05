'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, BellRing, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

// Define the notification type based on order data
type OrderNotification = {
  id: string;
  display_id: string;
  status: string;
  created_at: string;
  total_amount?: number;
};

export function SimpleNotificationBell() {
  // State for notifications
  const [notifications, setNotifications] = useState<OrderNotification[]>([]);
  const [count, setCount] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showAnimation, setShowAnimation] = useState(false);
  const [connectionStatus, setConnectionStatus] =
    useState<string>('CONNECTING');

  // Audio reference
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const router = useRouter();

  // Play notification sound with improved error handling
  const playSound = useCallback(() => {
    if (!soundEnabled) return;

    try {
      // Create a new Audio instance each time to avoid issues with multiple plays
      const audio = new Audio('/sound/notification.mp3');

      // Log that we're attempting to play
      console.log('Attempting to play notification sound');

      // Play the sound with better error handling
      audio
        .play()
        .then(() => {
          console.log('Sound played successfully');
        })
        .catch(err => {
          console.warn('Failed to play sound:', err);
          // Try an alternative approach for browsers with autoplay restrictions
          document.addEventListener(
            'click',
            function playOnClick() {
              audio.play();
              document.removeEventListener('click', playOnClick);
            },
            { once: true },
          );
        });
    } catch (err) {
      console.warn('Error playing sound:', err);
    }
  }, [soundEnabled]);

  // Toggle sound setting
  const toggleSound = () => {
    setSoundEnabled(!soundEnabled);

    // Save to localStorage
    try {
      localStorage.setItem('notification_sound', (!soundEnabled).toString());
    } catch (err) {
      console.warn('Failed to save sound setting:', err);
    }

    // Play test sound if enabling
    if (!soundEnabled) {
      playSound();
    }
  };

  // Set up real-time subscription to orders table
  useEffect(() => {
    // Load sound setting from localStorage
    try {
      const savedSetting = localStorage.getItem('notification_sound');
      if (savedSetting !== null) {
        setSoundEnabled(savedSetting === 'true');
      }
    } catch (err) {
      console.warn('Failed to load sound setting:', err);
    }

    // Initial fetch of pending orders
    const fetchPendingOrders = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('orders')
          .select('id, display_id, status, created_at, total_amount')
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) {
          console.error('Error fetching pending orders:', error);
          return;
        }

        if (data && data.length > 0) {
          setNotifications(data as OrderNotification[]);
          setCount(data.length);
        }
      } catch (err) {
        console.error('Failed to fetch pending orders:', err);
      }
    };

    fetchPendingOrders();

    // Set up real-time subscription
    const supabase = createClient();
    const channel = supabase
      .channel('orders-notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: 'status=eq.pending',
        },
        payload => {
          console.log('Received order change:', payload);

          // Handle different event types
          if (payload.eventType === 'INSERT') {
            const newOrder = payload.new as OrderNotification;

            // Add the new order to notifications
            setNotifications(prev => [newOrder, ...prev.slice(0, 8)]);
            setCount(prev => prev + 1);

            // Show animation and play sound
            setShowAnimation(true);
            playSound();
            setTimeout(() => setShowAnimation(false), 2000);
          } else if (payload.eventType === 'UPDATE') {
            // If status changed from pending to something else, remove it
            if (
              payload.old.status === 'pending' &&
              payload.new.status !== 'pending'
            ) {
              setNotifications(prev =>
                prev.filter(n => n.id !== payload.new.id),
              );
              setCount(prev => Math.max(0, prev - 1));
            }
          } else if (payload.eventType === 'DELETE') {
            // Remove deleted order
            setNotifications(prev => prev.filter(n => n.id !== payload.old.id));
            setCount(prev => Math.max(0, prev - 1));
          }
        },
      )
      .subscribe(status => {
        console.log('Subscription status:', status);
        setConnectionStatus(status);
      });

    // Clean up subscription
    return () => {
      supabase.removeChannel(channel);
    };
  }, [playSound]);

  // Navigate to order details
  const viewOrderDetails = (orderId: string) => {
    router.push(`/dashboard/orders/${orderId}`);
  };

  // Mark all as read
  const markAllAsRead = () => {
    setCount(0);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative w-10 h-10 bg-yellow-50 hover:bg-yellow-100 border border-yellow-200 rounded-full"
        >
          {showAnimation ? (
            <BellRing className="h-6 w-6 text-red-500 animate-bell" />
          ) : (
            <Bell
              className={`h-6 w-6 ${
                count > 0 ? 'text-red-500' : 'text-yellow-600'
              }`}
            />
          )}

          {/* Notification count badge */}
          {count > 0 && (
            <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-red-500 text-white border-2 border-background">
              {count}
            </Badge>
          )}

          {/* Connection indicator */}
          <span
            className={`absolute -bottom-1 -right-1 h-2 w-2 rounded-full ${
              connectionStatus === 'SUBSCRIBED'
                ? 'bg-green-500'
                : 'bg-yellow-500'
            }`}
          />

          {/* Sound indicator */}
          {!soundEnabled && (
            <span className="absolute bottom-0 right-0 h-2 w-2 bg-gray-400 rounded-full" />
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64 p-2">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold text-sm">Notifications</h4>
          <div className="flex items-center text-xs text-green-600">
            <span className="h-2 w-2 rounded-full bg-green-500 mr-1"></span>
            Live
          </div>
        </div>

        {notifications.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            <div className="mb-2">📭</div>
            <div>No pending orders</div>
          </div>
        ) : (
          <div className="space-y-2 mb-2">
            {notifications.map(notification => (
              <DropdownMenuItem
                key={notification.id}
                className="cursor-pointer"
                onClick={() => viewOrderDetails(notification.id)}
              >
                <div className="flex items-start gap-2 w-full">
                  <div className="bg-yellow-100 text-yellow-800 p-2 rounded-full">
                    <BellRing className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">New pending order</div>
                    <div className="text-sm">
                      {notification.display_id ||
                        `Order #${notification.id.slice(0, 8)}`}
                    </div>
                    {notification.total_amount && (
                      <div className="text-xs text-muted-foreground">
                        ${notification.total_amount.toFixed(2)}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground">
                      {new Date(notification.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              </DropdownMenuItem>
            ))}

            <DropdownMenuItem
              className="w-full justify-center font-medium text-sm"
              onClick={markAllAsRead}
            >
              Mark all as read
            </DropdownMenuItem>
          </div>
        )}

        <div className="pt-2 border-t border-muted">
          <div className="flex justify-between items-center">
            <Button
              variant="ghost"
              size="sm"
              className="justify-start text-xs"
              onClick={toggleSound}
            >
              {soundEnabled ? (
                <>
                  <Volume2 className="mr-2 h-4 w-4" />
                  Sound On
                </>
              ) : (
                <>
                  <VolumeX className="mr-2 h-4 w-4" />
                  Sound Off
                </>
              )}
            </Button>

            {soundEnabled && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={playSound}
              >
                Test Sound
              </Button>
            )}
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
