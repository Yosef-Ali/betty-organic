'use client';

import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatDate } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

// Define explicit types to match database structure
interface ProfileData {
  id: string;
  name: string | null;
  email: string;
  role: string;
  phone?: string | null;
  avatar_url?: string | null;
}

interface OrderNotification {
  id: string;
  display_id?: string;
  created_at: string | null;
  profile_id: string;
  status: string;
  total_amount: number;
  type: string;
  updated_at: string | null;
  profiles?: ProfileData;
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<OrderNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [animateBell, setAnimateBell] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const MAX_RETRIES = 3;
  const router = useRouter();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isInitialLoadRef = useRef(true);
  const previousCountRef = useRef(0);

  // Animation for the bell
  const bellAnimation = {
    initial: { rotate: 0 },
    animate: {
      rotate: [0, 15, -15, 10, -5, 0],
      transition: { duration: 0.7 }
    }
  };

  // Badge animation
  const badgeAnimation = {
    initial: { scale: 0 },
    animate: {
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 500,
        damping: 15
      }
    },
    exit: { scale: 0 }
  };

  const fetchNotifications = async () => {
    if (retryCountRef.current >= MAX_RETRIES) {
      console.log('Max retry attempts reached, waiting for next scheduled poll');
      retryCountRef.current = 0; // Reset for next scheduled attempt
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const supabase = createClient();
      
      // UPDATED: Using an "or" condition to match both empty and "pending" statuses
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .or('status.eq.pending,status.eq.')  // Match both "pending" and empty status
        .order('created_at', { ascending: false })
        .limit(7);

      if (ordersError) {
        console.error('Error fetching notifications:', ordersError);
        throw ordersError;
      }

      // Debug all order statuses to help diagnose the issue
      console.log('DEBUG - All fetched order statuses:', ordersData?.map(order => order.status));
      console.log(`Found ${ordersData?.length || 0} orders with pending or blank status`);

      // If we have orders, get the corresponding profiles
      if (ordersData && ordersData.length > 0) {
        // Extract unique profile IDs
        const profileIds = ordersData
          .map(order => order.profile_id)
          .filter(Boolean);

        // Fetch profiles for these IDs if any exist
        if (profileIds.length > 0) {
          const { data: profilesData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .in('id', profileIds);
            
          if (profileError) {
            console.error('Error fetching profiles:', profileError);
            throw profileError;
          }

          // Combine data
          const ordersWithProfiles = ordersData.map(order => {
            const profile = profilesData?.find(p => p.id === order.profile_id);
            return {
              ...order,
              profiles: profile
            };
          });

          const newNotificationCount = ordersWithProfiles.length;

          // Only play sound if:
          // 1. It's not the initial load
          // 2. The notification count has increased
          if (!isInitialLoadRef.current && newNotificationCount > previousCountRef.current) {
            setAnimateBell(true); // Trigger animation
            playNotificationSound();
          }

          previousCountRef.current = newNotificationCount;
          isInitialLoadRef.current = false;
          setNotifications(ordersWithProfiles);
          setUnreadCount(newNotificationCount);
          // Reset retry count on success
          retryCountRef.current = 0;
          return;
        }
      }

      // Default case - no orders or profiles
      isInitialLoadRef.current = false;
      previousCountRef.current = 0;
      setNotifications([]);
      setUnreadCount(0);
      // Reset retry count on success
      retryCountRef.current = 0;
    } catch (error) {
      setError(typeof error === 'object' && error !== null && 'message' in error 
        ? String(error.message)
        : 'Failed to fetch notifications');
      console.error('Failed to fetch notifications:', error);
      
      // Implement retry with exponential backoff
      retryCountRef.current += 1;
      const backoffTime = Math.min(1000 * Math.pow(2, retryCountRef.current), 10000);
      
      console.log(`Retry attempt ${retryCountRef.current}/${MAX_RETRIES} in ${backoffTime}ms`);
      
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      
      retryTimeoutRef.current = setTimeout(() => {
        fetchNotifications();
      }, backoffTime);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchNotifications();

    // Set up polling for notifications (in case real-time fails)
    const pollingInterval = setInterval(fetchNotifications, 30000); // every 30 seconds

    // Set up real-time subscription
    const channel = supabase
      .channel('orders-notifications')
      .on('postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          console.log('New order received in real-time:', payload);
          setAnimateBell(true); // Trigger animation on new order
          fetchNotifications();
          playNotificationSound();
        }
      )
      .on('postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: 'status=eq.pending'
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe((status) => {
        console.log('Supabase notification subscription status:', status);
      });

    return () => {
      clearInterval(pollingInterval);
      supabase.removeChannel(channel);
    };
  }, []);

  // Reset animation after it completes
  useEffect(() => {
    if (animateBell) {
      const timer = setTimeout(() => {
        setAnimateBell(false);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [animateBell]);

  const playNotificationSound = () => {
    try {
      if (audioRef.current) {
        // Reset the audio to the beginning in case it was already playing
        audioRef.current.currentTime = 0;

        // Play the notification sound with volume turned up
        audioRef.current.volume = 1.0;
        audioRef.current.play().then(() => {
          console.log('Notification sound played successfully');
        }).catch(error => {
          console.error('Error playing notification sound (autoplay policy):', error);

          // Try playing on next user interaction
          const handleUserInteraction = () => {
            audioRef.current?.play().catch(e => console.error('Still cannot play audio:', e));
            document.removeEventListener('click', handleUserInteraction);
          };
          document.addEventListener('click', handleUserInteraction, { once: true });
        });
      } else {
        // Fallback: try to play using the DOM element if available
        const audioElement = document.getElementById('notificationSound') as HTMLAudioElement;
        if (audioElement) {
          audioElement.currentTime = 0;
          audioElement.volume = 1.0;
          audioElement.play().catch(error => {
            console.error('Error playing notification sound from DOM:', error);
          });
        } else {
          console.error('No audio element available for notification sound');
        }
      }
    } catch (error) {
      console.error('Failed to play notification sound:', error);
    }
  };

  const handleNotificationClick = (orderId: string) => {
    router.push(`/dashboard/orders/${orderId}`);
  };

  const getCustomerDisplay = (notification: OrderNotification) => {
    if (notification.profiles?.name) return notification.profiles.name;
    if (notification.profiles?.email) return notification.profiles.email;
    if (notification.profiles?.phone) return notification.profiles.phone;
    return 'Unknown Customer';
  };

  // Trigger useEffect logging
  useEffect(() => {
    console.log('NotificationBell: Current unreadCount:', unreadCount);
  }, [unreadCount]);

  return (
    <>
      {/* Adding this audio element ensures that the sound can be played */}
      <audio id="notificationSound" src="/notification.mp3" preload="auto" />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative">
            <motion.div
              initial="initial"
              animate={animateBell ? "animate" : "initial"}
              variants={bellAnimation}
            >
              <Bell className="h-5 w-5" />
            </motion.div>

            <AnimatePresence>
              {unreadCount > 0 && (
                <motion.span
                  key="notification-badge"
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  variants={badgeAnimation}
                  className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white"
                >
                  {unreadCount}
                </motion.span>
              )}
            </AnimatePresence>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <div className="p-2">
            <h4 className="font-semibold mb-2">Recent Orders</h4>
            {notifications.length === 0 ? (
              <p className="text-sm text-muted-foreground">No pending orders</p>
            ) : (
              <div className="space-y-2">
                {notifications.map((order) => (
                  <DropdownMenuItem
                    key={order.id}
                    className="flex flex-col items-start p-2 cursor-pointer"
                    onClick={() => handleNotificationClick(order.id)}
                  >
                    <div className="flex justify-between w-full">
                      <span className="font-medium">
                        {order.display_id || order.id.slice(0, 8)}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {order.created_at ? formatDate(order.created_at) : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between w-full text-sm">
                      <span>{getCustomerDisplay(order)}</span>
                      <span>ETB {order.total_amount.toFixed(2)}</span>
                    </div>
                    <div className="w-full text-right">
                      <span className="text-xs text-yellow-600">Pending</span>
                    </div>
                  </DropdownMenuItem>
                ))}
              </div>
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
