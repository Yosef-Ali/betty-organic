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
  const router = useRouter();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isInitialLoadRef = useRef(true);
  const previousCountRef = useRef(0);

  useEffect(() => {
    // Initialize audio element
    audioRef.current = new Audio('/notification.mp3');

    const fetchNotifications = async () => {
      try {
        console.log('Fetching notifications...');
        const supabase = createClient();

        // Use a different approach - first fetch orders, then the corresponding profiles
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('*')
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

          // Fetch profiles for these IDs if any exist
          if (profileIds.length > 0) {
            const { data: profilesData } = await supabase
              .from('profiles')
              .select('*')
              .in('id', profileIds);

            console.log(`Found ${profilesData?.length || 0} profiles for orders`);

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
              console.log('New notification received, playing sound');
              playNotificationSound();
            }

            previousCountRef.current = newNotificationCount;
            isInitialLoadRef.current = false;
            setNotifications(ordersWithProfiles);
            setUnreadCount(newNotificationCount);
            return;
          }
        }

        // Default case - no orders or profiles
        isInitialLoadRef.current = false;
        previousCountRef.current = 0;
        setNotifications([]);
        setUnreadCount(0);
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      }
    };

    // Initial fetch
    fetchNotifications();

    // Set up polling for notifications (in case real-time fails)
    const pollingInterval = setInterval(fetchNotifications, 30000); // every 30 seconds

    // Set up real-time subscription
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
          console.log('New order received in real-time:', payload);
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

  const playNotificationSound = () => {
    try {
      console.log('Attempting to play notification sound');

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

  return (
    <>
      {/* Adding this audio element ensures that the sound can be played */}
      <audio id="notificationSound" src="/notification.mp3" preload="auto" />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
                {unreadCount}
              </span>
            )}
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
