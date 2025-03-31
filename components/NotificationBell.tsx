'use client';

import { Bell } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface ProfileData {
  id: string;
  name?: string | null;
  email?: string;
  phone?: string | null;
}

interface OrderNotification {
  id: string;
  display_id?: string;
  created_at: string | null;
  status: string;
  total_amount: number;
  profile_id?: string;
  profile?: ProfileData;
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<OrderNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isInitialLoadRef = useRef(true);
  const router = useRouter();

  // Animation for the bell
  const bellAnimation = {
    initial: { rotate: 0 },
    animate: {
      rotate: [0, 15, -15, 0],
      transition: { duration: 0.5 }
    }
  };

  // Function to play notification sound
  const playNotificationSound = () => {
    try {
      console.log('Attempting to play notification sound');
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.volume = 1.0;
        audioRef.current.play().then(() => {
          console.log('Notification sound played successfully');
        }).catch(error => {
          console.error('Error playing notification sound:', error);
          // Try playing on next user interaction
          document.addEventListener('click', () => {
            audioRef.current?.play().catch(e => console.error('Still cannot play audio:', e));
          }, { once: true });
        });
      } else {
        // Fallback: try to play using the DOM element
        const audioElement = document.getElementById('notificationSound') as HTMLAudioElement;
        if (audioElement) {
          audioElement.currentTime = 0;
          audioElement.volume = 1.0;
          audioElement.play().catch(error => {
            console.error('Error playing notification sound from DOM:', error);
          });
        }
      }
    } catch (error) {
      console.error('Failed to play notification sound:', error);
    }
  };

  useEffect(() => {
    // Initialize audio element
    audioRef.current = new Audio('/notification.mp3');

    const fetchNotifications = async () => {
      try {
        console.log('Fetching notifications...');
        const supabase = createClient();

        // Fetch pending orders - only request columns we know exist
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('id, created_at, status, total_amount, profile_id')
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(7);

        if (ordersError) {
          console.error('Error fetching notifications:', ordersError);
          return;
        }

        console.log(`Found ${ordersData?.length || 0} pending orders`);

        // If we have orders, get the corresponding profiles
        if (ordersData && ordersData.length > 0) {
          // Extract unique profile IDs
          const profileIds = ordersData
            .map(order => order.profile_id)
            .filter(Boolean);

          // Fetch profiles for these IDs
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('id, name, email')
            .in('id', profileIds);

          console.log(`Found ${profilesData?.length || 0} profiles for orders`);

          // Combine data - explicitly create objects with known properties
          const ordersWithProfiles = ordersData.map(order => {
            const profile = profilesData?.find(p => p.id === order.profile_id);
            // Create a new object with only the properties we need
            return {
              id: order.id,
              created_at: order.created_at,
              status: order.status,
              total_amount: order.total_amount,
              profile_id: order.profile_id,
              profile: profile ? {
                id: profile.id,
                name: profile.name,
                email: profile.email
              } : undefined
            } as OrderNotification;
          });

          const newCount = ordersWithProfiles.length;

          // Only play sound if:
          // 1. It's not the initial load
          // 2. The notification count has increased
          if (!isInitialLoadRef.current && newCount > unreadCount) {
            console.log('New order received, playing sound');
            playNotificationSound();
          }

          isInitialLoadRef.current = false;
          setNotifications(ordersWithProfiles);
          setUnreadCount(newCount);
          return;
        }

        // Default case - no orders
        isInitialLoadRef.current = false;
        setNotifications([]);
        setUnreadCount(0);
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      }
    };

    // Initial fetch
    fetchNotifications();

    // Set up polling (backup for real-time)
    const pollingInterval = setInterval(fetchNotifications, 30000);

    // Set up Supabase real-time subscription
    const supabase = createClient();
    const channel = supabase
      .channel('orders-notifications')
      .on('postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          console.log('New order inserted:', payload);
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
        (payload) => {
          console.log('Order status updated to pending:', payload);
          fetchNotifications();
        }
      )
      .subscribe((status) => {
        console.log('Supabase subscription status:', status);
      });

    return () => {
      clearInterval(pollingInterval);
      supabase.removeChannel(channel);
    };
  }, [unreadCount]);

  const handleOrderClick = (orderId: string) => {
    router.push(`/dashboard/orders/${orderId}`);
  };

  // Format the date in a human-readable format
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Get customer name or identifier
  const getCustomerDisplay = (notification: OrderNotification) => {
    if (notification.profile?.name) return notification.profile.name;
    if (notification.profile?.email) return notification.profile.email;
    if (notification.profile?.phone) return notification.profile.phone;
    return 'Unknown Customer';
  };

  return (
    <>
      {/* Hidden audio element as fallback */}
      <audio id="notificationSound" src="/notification.mp3" preload="auto" style={{ display: 'none' }} />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative">
            <motion.div
              initial="initial"
              animate={unreadCount > 0 ? "animate" : "initial"}
              variants={bellAnimation}
            >
              <Bell className="h-5 w-5" />
            </motion.div>

            <AnimatePresence>
              {unreadCount > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-xs text-white flex items-center justify-center"
                >
                  {unreadCount}
                </motion.div>
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
                    onClick={() => handleOrderClick(order.id)}
                  >
                    <div className="flex justify-between w-full">
                      <span className="font-medium">
                        {order.display_id || order.id.slice(0, 8)}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(order.created_at)}
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
