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

interface OrderNotification {
  id: string;
  created_at: string | null;
  profile_id: string;
  status: string;
  total_amount: number;
  type: string;
  updated_at: string | null;
  profiles?: {
    id: string;
    name: string | null;
    email: string;
    role: string;
    phone?: string | null;
  };
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<OrderNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const router = useRouter();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isInitialLoadRef = useRef(true);

  useEffect(() => {
    // Initialize audio element
    audioRef.current = new Audio('/notification.mp3');
    
    const fetchNotifications = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('orders')
          .select('*, profiles:customer_profile_id(*)')
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(7);

        if (error) {
          console.error('Error fetching notifications:', error);
          return;
        }

        const newNotificationCount = data?.length || 0;
        
        // Only play sound if:
        // 1. It's not the initial load
        // 2. The notification count has increased
        if (!isInitialLoadRef.current && newNotificationCount > unreadCount) {
          console.log('New notification received, playing sound');
          playNotificationSound();
        }
        
        isInitialLoadRef.current = false;
        setNotifications(data || []);
        setUnreadCount(newNotificationCount);
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
  }, [unreadCount]);

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
      <audio id="notificationSound" src="/notification.mp3" preload="auto" />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
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
                        {order.id.slice(0, 8)}
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
