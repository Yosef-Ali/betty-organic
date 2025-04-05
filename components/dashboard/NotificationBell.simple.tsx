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

  // Play notification sound
  const playSound = useCallback(() => {
    if (!soundEnabled) return;

    try {
      // Create a new Audio instance each time
      const audio = new Audio('/sound/notification.mp3');

      // Play the sound
      audio.play().catch(err => {
        console.warn('Failed to play sound:', err);
      });
    } catch (err) {
      console.warn('Error playing sound:', err);
    }
  }, [soundEnabled]);

  // Toggle sound setting
  const toggleSound = () => {
    const newSoundEnabled = !soundEnabled;
    setSoundEnabled(newSoundEnabled);

    // Save to localStorage
    try {
      localStorage.setItem('notification_sound', newSoundEnabled.toString());
    } catch (err) {
      console.warn('Failed to save sound setting:', err);
    }

    // Play test sound if enabling
    if (newSoundEnabled) {
      playSound();
    }
  };

  // Test sound function
  const testSound = () => {
    playSound();
  };

  // Navigate to order details
  const viewOrderDetails = (orderId: string) => {
    router.push(`/dashboard/orders/${orderId}`);
  };

  // Set up real-time subscription and fetch initial data
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

    // Fetch pending orders from database
    const fetchPendingOrders = async () => {
      try {
        console.log('Creating Supabase client for fetch...');
        const supabase = createClient();

        if (!supabase) {
          console.error('Failed to create Supabase client');
          setNotifications([]);
          setCount(0);
          return;
        }

        const { data, error } = await supabase
          .from('orders')
          .select('id, display_id, status, created_at, total_amount')
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) {
          console.error('Error fetching pending orders:', error);
          setNotifications([]);
          setCount(0);
          return;
        }

        if (data && data.length > 0) {
          setNotifications(data as OrderNotification[]);
          setCount(data.length);
        } else {
          setNotifications([]);
          setCount(0);
        }
      } catch (err) {
        console.error('Failed to fetch pending orders:', err);
        setNotifications([]);
        setCount(0);
      }
    };

    // Initial fetch
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
        },
        payload => {
          // For INSERT events
          if (payload.eventType === 'INSERT') {
            const newOrder = payload.new as OrderNotification;

            // Only add to notifications if it's pending
            if (newOrder.status === 'pending') {
              // Add the new order to notifications, keeping up to 10
              setNotifications(prev => [newOrder, ...prev.slice(0, 9)]);
              setCount(prev => prev + 1);

              // Show animation and play sound
              setShowAnimation(true);
              playSound();
              setTimeout(() => setShowAnimation(false), 2000);
            }
          } else if (payload.eventType === 'UPDATE') {
            // If status changed from pending to something else, remove it
            if (
              payload.old?.status === 'pending' &&
              payload.new?.status !== 'pending'
            ) {
              setNotifications(prev =>
                prev.filter(n => n.id !== payload.new.id),
              );
              setCount(prev => Math.max(0, prev - 1));
            }
            // If status changed TO pending, add it
            else if (
              payload.old?.status !== 'pending' &&
              payload.new?.status === 'pending'
            ) {
              const updatedOrder = payload.new as OrderNotification;
              setNotifications(prev => [updatedOrder, ...prev.slice(0, 9)]);
              setCount(prev => prev + 1);

              // Show animation and play sound for new pending orders
              setShowAnimation(true);
              playSound();
              setTimeout(() => setShowAnimation(false), 2000);
            }
          } else if (payload.eventType === 'DELETE') {
            // Remove deleted order
            if (payload.old?.status === 'pending') {
              setNotifications(prev =>
                prev.filter(n => n.id !== payload.old.id),
              );
              setCount(prev => Math.max(0, prev - 1));
            }
          }
        },
      )
      .subscribe(status => {
        setConnectionStatus(status);

        // When connected, fetch orders again to ensure we have the latest
        if (status === 'SUBSCRIBED') {
          fetchPendingOrders();
        }
      });

    // Clean up subscription
    return () => {
      supabase.removeChannel(channel);
    };
  }, [playSound]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative w-10 h-10 bg-yellow-50 hover:bg-yellow-100 border border-yellow-200 rounded-full"
        >
          <div className={showAnimation ? 'animate-bell' : ''}>
            {showAnimation ? (
              <BellRing className="h-6 w-6 text-red-500" />
            ) : (
              <Bell
                className={`h-6 w-6 ${
                  count > 0 ? 'text-red-500' : 'text-yellow-600'
                }`}
              />
            )}
          </div>

          {count > 0 && (
            <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-red-500 text-white border-2 border-background">
              {count}
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

      <DropdownMenuContent align="end" className="w-64 p-2">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold text-sm">Pending Orders</h4>
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
          <div className="max-h-[300px] overflow-y-auto space-y-2 mb-2">
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
                onClick={testSound}
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
