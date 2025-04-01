'use client';

import { Bell } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { RealtimePostgresChangesPayload, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
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
  // Debug display element
  const [debugState, setDebugState] = useState<string>('Initializing...');
  const [notifications, setNotifications] = useState<OrderNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isInitialLoadRef = useRef(true);
  const supabaseRef = useRef<SupabaseClient<Database> | null>(null);
  const channelRef = useRef<ReturnType<SupabaseClient<Database>['channel']> | null>(null);
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

  // Debug function to check Supabase configuration
  const checkSupabaseConfig = async () => {
    try {
      setDebugState('Checking Supabase configuration...');

      // Check environment variables
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!url || !key) {
        setDebugState('Missing Supabase configuration!');
        return false;
      }

      // Test database connection
      const supabase = createClient();
      const { error } = await supabase.from('orders').select('count', { count: 'exact', head: true });

      if (error) {
        setDebugState(`Database connection error: ${error.message}`);
        return false;
      }

      setDebugState('Supabase configuration verified');
      return true;
    } catch (error) {
      setDebugState(`Config check error: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  };

  useEffect(() => {
    let mounted = true;
    let pollingInterval: NodeJS.Timeout;

    const fetchNotifications = async () => {
      if (!mounted) return;

      try {
        const supabase = createClient();

        // --- Enhanced RLS Debugging ---
        try {
          const { data: user, error: userError } = await supabase.auth.getUser();
          console.log('NotificationBell: Auth Context:', {
            userId: user?.user?.id,
            userError: userError?.message
          });

          if (user?.user?.id) {
            // Direct profile query as fallback
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', user.user.id)
              .single();

            console.log('NotificationBell: Profile Check:', {
              profileRole: profile?.role,
              profileError: profileError?.message
            });

            // Test RLS by querying a single order
            const { data: testOrder, error: testError } = await supabase
              .from('orders')
              .select('id')
              .limit(1)
              .maybeSingle();

            console.log('NotificationBell: RLS Test Query:', {
              testOrderId: testOrder?.id,
              testError: testError?.message
            });
          }
        } catch (debugError) {
          console.error('NotificationBell: Debug error:', debugError);
        }
        // --- End Enhanced Debugging ---

        // Log the URL being used by the client
        console.log('NotificationBell: Using Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);

        // Restore status filter
        setDebugState('Fetching pending orders...');
        const query = supabase
          .from('orders')
          .select('id, created_at, status, total_amount, profile_id')
          .ilike('status', 'pending') // Restore filter
          .order('created_at', { ascending: false })
          .limit(7); // Restore original limit

        // Log the query itself (this might not show the exact SQL but helps)
        console.log('NotificationBell: Executing query:', query);

        const { data: ordersData, error: ordersError } = await query;

        // Log raw response
        console.log('NotificationBell: Raw fetch response:', { ordersData, ordersError });


        if (!mounted) return;

        if (ordersError) {
          setDebugState(`Error fetching orders: ${ordersError.message}`);
          console.error('Error fetching orders:', ordersError); // Log error object
          return;
        }

        // Log the count based on raw data
        console.log(`NotificationBell: Raw data count: ${ordersData?.length ?? 'undefined'}`);
        setDebugState(`Found ${ordersData?.length || 0} orders (any status)`);

        if (ordersData && ordersData.length > 0) {
          const profileIds = ordersData.map(order => order.profile_id).filter(Boolean);
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('id, name, email')
            .in('id', profileIds);

          if (!mounted) return;

          const ordersWithProfiles = ordersData.map(order => ({
            id: order.id,
            created_at: order.created_at,
            status: order.status,
            total_amount: order.total_amount,
            profile_id: order.profile_id,
            profile: profilesData?.find(p => p.id === order.profile_id)
          }));

          const newCount = ordersWithProfiles.length;

          // Update debug state *before* playing sound/setting state
          setDebugState(`Fetch complete. Found ${newCount} pending. Previous count: ${unreadCount}`);

          if (!isInitialLoadRef.current && newCount > unreadCount) {
            setDebugState(`New order detected! Playing sound. Count: ${newCount}`);
            playNotificationSound();
          } else if (isInitialLoadRef.current) {
            setDebugState(`Initial load complete. Count: ${newCount}`);
          } else {
            setDebugState(`Fetch complete, no new orders. Count: ${newCount}`);
          }

          setNotifications(ordersWithProfiles);
          setUnreadCount(newCount);
        } else {
          setDebugState(`Fetch complete. Found 0 pending orders.`);
          setNotifications([]);
          setUnreadCount(0);
        }

        isInitialLoadRef.current = false;
      } catch (error) {
        if (mounted) {
          setDebugState(`Error: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    };

    const initialize = async () => {
      try {
        setDebugState('Initializing...');
        const isConfigValid = await checkSupabaseConfig();
        if (!isConfigValid || !mounted) return;

        audioRef.current = new Audio('/notification.mp3');
        await fetchNotifications();

        if (!mounted) return;

        // Set up polling
        pollingInterval = setInterval(fetchNotifications, 30000);

        // Set up realtime subscription
        supabaseRef.current = createClient();
        if (!supabaseRef.current) {
          setDebugState('Failed to create Supabase client');
          return;
        }

        setDebugState('Setting up realtime subscription...');

        const channel = supabaseRef.current
          .channel('orders-notifications');

        channelRef.current = channel;

        channel
          .on('postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'orders' },
            (payload: RealtimePostgresChangesPayload<{ [key: string]: any }>) => {
              console.log('Realtime INSERT Payload:', payload); // Log the payload
              if (mounted) {
                // Safely access payload.new.id
                const newOrderId = (payload.new as { id?: string })?.id ?? 'unknown';
                setDebugState(`Realtime INSERT received: ${newOrderId}`);
                fetchNotifications(); // Fetch will handle sound/count update
              }
            }
          )
          .on('postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'orders', filter: 'status=eq.pending' },
            (payload: RealtimePostgresChangesPayload<{ [key: string]: any }>) => {
              console.log('Realtime UPDATE Payload:', payload); // Log the payload
              if (mounted) {
                // Safely access payload.new.id
                const updatedOrderId = (payload.new as { id?: string })?.id ?? 'unknown';
                setDebugState(`Realtime UPDATE received: ${updatedOrderId}`);
                fetchNotifications();
              }
            }
          );

        // Subscribe to the channel
        channel
          .subscribe(async (status) => {
            if (!mounted) return;

            setDebugState(`Realtime status: ${status}`);

            if (status === 'SUBSCRIBED') {
              setDebugState('Connected to realtime updates');
              await fetchNotifications();
            } else if (status === 'CHANNEL_ERROR') {
              setDebugState('Failed to connect to realtime updates');
            }
          });
      } catch (error) {
        if (mounted) {
          setDebugState(`Init error: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    };

    initialize();

    return () => {
      mounted = false;
      if (pollingInterval) clearInterval(pollingInterval);
      if (channelRef.current) channelRef.current.unsubscribe();
    };
  }, []);

  // Debug log when component renders
  console.log('NotificationBell: Component rendering, unreadCount:', unreadCount);

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

      {/* Debug state display */}
      <div className="absolute -top-8 left-0 text-xs text-muted-foreground whitespace-nowrap">
        {debugState}
      </div>

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
