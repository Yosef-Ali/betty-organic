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

  // Enhanced notification sound function with multiple fallbacks
  const playSound = useCallback(() => {
    if (!soundEnabled) {
      console.log('Sound is disabled, not playing notification');
      return;
    }

    try {
      console.log('🔊 Attempting to play notification sound...');

      // Try to use a pre-loaded audio element if possible
      if (!audioRef.current) {
        console.log('Creating new Audio element');
        audioRef.current = new Audio('/sound/notification.mp3');

        // Preload the audio
        audioRef.current.preload = 'auto';

        // Set up event listeners for debugging
        audioRef.current.addEventListener('canplaythrough', () => {
          console.log('Audio can play through without buffering');
        });

        audioRef.current.addEventListener('error', e => {
          console.error('Audio error:', e);
        });
      }

      // Reset the audio to the beginning
      audioRef.current.currentTime = 0;

      // Try to play with promise-based API
      const playPromise = audioRef.current.play();

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('🔊 Sound played successfully!');
          })
          .catch(err => {
            console.warn('Failed to play sound:', err);

            // Fallback 1: Create a brand new Audio instance
            console.log('Trying fallback 1: New Audio instance');
            const newAudio = new Audio('/sound/notification.mp3');
            newAudio.play().catch(err2 => {
              console.warn('Fallback 1 failed:', err2);

              // Fallback 2: Try with user interaction
              console.log('Trying fallback 2: Wait for user interaction');
              const clickHandler = () => {
                const clickAudio = new Audio('/sound/notification.mp3');
                clickAudio.play();
                document.removeEventListener('click', clickHandler);
              };
              document.addEventListener('click', clickHandler, { once: true });
            });
          });
      } else {
        // For older browsers without promise-based API
        console.log('Browser does not support promise-based audio API');
      }
    } catch (err) {
      console.warn('Error in playSound function:', err);
    }
  }, [soundEnabled]);

  // Toggle sound setting with test sound
  const toggleSound = () => {
    const newSoundEnabled = !soundEnabled;
    console.log(`Toggling sound to: ${newSoundEnabled ? 'ON' : 'OFF'}`);
    setSoundEnabled(newSoundEnabled);

    // Save preference to localStorage
    try {
      localStorage.setItem('notification_sound', newSoundEnabled.toString());
      console.log('Sound preference saved to localStorage');
    } catch (err) {
      console.warn('Failed to save sound preference to localStorage:', err);
    }

    // Play test sound if enabling
    if (newSoundEnabled) {
      console.log('Playing test sound after enabling');
      playSound();
    }
  };

  // Function to manually test the notification sound
  const testSound = () => {
    console.log('Testing notification sound...');
    playSound();
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

    // Enhanced initial fetch of pending orders with better error handling and debugging
    const fetchPendingOrders = async () => {
      console.log('🔎 Fetching pending orders from database...');
      try {
        const supabase = createClient();

        // Log the query we're about to make
        console.log('Querying orders table for status=pending');

        const { data, error, count } = await supabase
          .from('orders')
          .select('id, display_id, status, created_at, total_amount', {
            count: 'exact',
          })
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) {
          console.error('Error fetching pending orders:', error);
          return;
        }

        console.log(
          `Found ${data?.length || 0} pending orders, total count: ${
            count || 0
          }`,
        );

        if (data && data.length > 0) {
          console.log('Pending orders data:', data);
          setNotifications(data as OrderNotification[]);
          setCount(data.length);

          // Play sound on initial load if there are pending orders and this isn't the first render
          if (data.length > 0 && connectionStatus !== 'CONNECTING') {
            console.log('Playing sound for initial pending orders');
            setShowAnimation(true);
            playSound();
            setTimeout(() => setShowAnimation(false), 2000);
          }
        } else {
          console.log('No pending orders found');
          setNotifications([]);
          setCount(0);
        }
      } catch (err) {
        console.error('Failed to fetch pending orders:', err);
      }
    };

    fetchPendingOrders();

    // Set up real-time subscription with enhanced debugging
    console.log('Setting up real-time subscription for orders...');
    const supabase = createClient();

    // Log Supabase client info
    console.log('Supabase client initialized:', !!supabase);

    // Create a more specific channel name
    const channelName = 'orders-notifications-' + Date.now();
    console.log('Creating channel:', channelName);

    // Subscribe to ALL order changes without filter to ensure we catch everything
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events
          schema: 'public',
          table: 'orders',
          // Remove the filter to catch all orders initially
        },
        payload => {
          console.log('🔔 NOTIFICATION: Received order change:', payload);
          console.log('Event type:', payload.eventType);
          console.log('Order data:', payload.new);

          // For INSERT events, always notify regardless of status
          if (payload.eventType === 'INSERT') {
            const newOrder = payload.new as OrderNotification;
            console.log('New order detected:', newOrder);

            // Only add to notifications if it's pending
            if (newOrder.status === 'pending') {
              // Add the new order to notifications
              setNotifications(prev => [newOrder, ...prev.slice(0, 8)]);
              setCount(prev => prev + 1);

              // Show animation and play sound
              setShowAnimation(true);
              console.log('Playing notification sound...');
              playSound();
              setTimeout(() => setShowAnimation(false), 2000);
            }
          } else if (payload.eventType === 'UPDATE') {
            console.log('Order updated:', payload.old, '->', payload.new);
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
              setNotifications(prev => [updatedOrder, ...prev.slice(0, 8)]);
              setCount(prev => prev + 1);

              // Show animation and play sound for new pending orders
              setShowAnimation(true);
              playSound();
              setTimeout(() => setShowAnimation(false), 2000);
            }
          } else if (payload.eventType === 'DELETE') {
            console.log('Order deleted:', payload.old);
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
        console.log('🔔 Subscription status changed:', status);
        setConnectionStatus(status);

        // When connected, fetch orders again to ensure we have the latest
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to real-time updates!');
          fetchPendingOrders();
        }
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
                onClick={testSound}
              >
                Test Sound
              </Button>
            )}
          </div>

          {/* Debug section */}
          <div className="mt-2 pt-2 border-t border-muted">
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">
                Connection: {connectionStatus}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => {
                  // Simulate a new notification for testing
                  const testNotification = {
                    id: `test-${Date.now()}`,
                    display_id: `BO-${new Date()
                      .toISOString()
                      .slice(0, 10)}-${Math.floor(Math.random() * 1000)}`,
                    status: 'pending',
                    created_at: new Date().toISOString(),
                    total_amount: Math.floor(Math.random() * 200) + 50,
                  };

                  // Add to notifications
                  setNotifications(prev => [
                    testNotification,
                    ...prev.slice(0, 8),
                  ]);
                  setCount(prev => prev + 1);

                  // Show animation and play sound
                  setShowAnimation(true);
                  playSound();
                  setTimeout(() => setShowAnimation(false), 2000);
                }}
              >
                Add Test Notification
              </Button>
            </div>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
