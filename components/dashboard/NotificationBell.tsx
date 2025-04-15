"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { Bell, BellRing, Volume2, VolumeX } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import {
  NotificationOrder,
  fetchPendingOrdersForNotification,
} from "@/app/actions/notificationBellActions";
import { isOrderPending } from "@/app/utils/notificationUtils";

export function NotificationBell() {
  const [notifications, setNotifications] = useState<NotificationOrder[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [animateBell, setAnimateBell] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    try {
      const saved = localStorage.getItem("notification_sound");
      return saved !== null ? saved === "true" : true;
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
        audioRef.current = new Audio("/sound/notification.mp3");
        audioRef.current.preload = "auto";
      }

      // Reset to beginning and play
      audioRef.current.currentTime = 0;
      await audioRef.current.play();
    } catch (err) {
      console.warn("Notification sound error:", err);
    }
  }, [soundEnabled]);

  // Toggle sound setting
  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const newValue = !prev;
      try {
        localStorage.setItem("notification_sound", newValue.toString());
      } catch (e) {
        console.warn("Failed to save sound preference:", e);
      }
      return newValue;
    });
  }, []);

  // Track the last time we fetched data to prevent excessive calls
  const lastFetchTimeRef = useRef<number>(0);

  // Fetch pending orders with cooldown protection
  const fetchPendingOrders = useCallback(async () => {
    if (!mountedRef.current) return;

    // Add cooldown of 5 seconds to prevent excessive API calls
    const now = Date.now();
    const cooldownPeriod = 5000; // 5 seconds

    if (now - lastFetchTimeRef.current < cooldownPeriod) {
      console.log("[NotificationBell] Skipping fetch - cooldown period active");
      return;
    }

    // Update last fetch time
    lastFetchTimeRef.current = now;

    console.log("[NotificationBell] Fetching pending orders");
    setIsLoading(true);

    try {
      // Use the server action to fetch pending orders
      const response = await fetchPendingOrdersForNotification(user?.id);

      if (!response.success) {
        setError(response.error || "Failed to load orders");
        setNotifications([]);
        setUnreadCount(0);
        return;
      }

      if (mountedRef.current) {
        setNotifications(response.orders);
        // Always ensure unreadCount matches the actual number of notifications
        setUnreadCount(response.orders.length);
        setError(null);
      }
    } catch (err) {
      if (mountedRef.current) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
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

      // Don't create a new channel if one already exists
      if (channelRef.current) {
        console.log("Reusing existing notification channel");
        return;
      }

      // Create a stable channel name based on user ID
      // This prevents creating multiple channels for the same user
      const channelName = user?.id
        ? `orders-notifications-${user.id}`
        : "orders-notifications-anonymous";

      // Set up the channel
      const channel = supabaseRef.current
        .channel(channelName)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "orders",
            // Filter by customer_profile_id if user is authenticated
            ...(user?.id
              ? { filter: `customer_profile_id=eq.${user.id}` }
              : {}),
          },
          (payload: RealtimePostgresChangesPayload<NotificationOrder>) => {
            // Log the order ID for debugging if needed
            // const orderId =
            //   typeof payload.new === "object" &&
            //   payload.new &&
            //   "id" in payload.new
            //     ? payload.new.id
            //     : typeof payload.old === "object" &&
            //       payload.old &&
            //       "id" in payload.old
            //     ? payload.old.id
            //     : "unknown";

            // Check if this is a pending order
            const isPending = (() => {
              if (
                typeof payload.new !== "object" ||
                !payload.new ||
                !("status" in payload.new)
              ) {
                return false;
              }

              return isOrderPending(payload.new.status);
            })();

            // Handle different event types to update the badge count in real-time
            if (payload.eventType === "INSERT" && isPending) {
              // For new pending orders, increment the count and add to notifications
              if (payload.new && typeof payload.new === "object") {
                setUnreadCount((prev) => prev + 1);
                setNotifications((prev) => [
                  payload.new as NotificationOrder,
                  ...prev,
                ]);
              }
            } else if (payload.eventType === "UPDATE") {
              // For updates, check if status changed to/from pending
              const oldIsPending =
                payload.old &&
                typeof payload.old === "object" &&
                "status" in payload.old &&
                isOrderPending(payload.old.status as string);

              if (isPending && !oldIsPending) {
                // Changed from non-pending to pending - increment count
                setUnreadCount((prev) => prev + 1);
                if (payload.new && typeof payload.new === "object") {
                  setNotifications((prev) => [
                    payload.new as NotificationOrder,
                    ...prev,
                  ]);
                }
              } else if (!isPending && oldIsPending) {
                // Changed from pending to non-pending - decrement count
                setUnreadCount((prev) => Math.max(0, prev - 1));
                if (
                  payload.old &&
                  typeof payload.old === "object" &&
                  "id" in payload.old
                ) {
                  setNotifications((prev) =>
                    prev.filter(
                      (item) =>
                        item.id !== (payload.old as NotificationOrder).id
                    )
                  );
                }
              }
            } else if (payload.eventType === "DELETE") {
              // For deletions, check if it was a pending order
              if (
                payload.old &&
                typeof payload.old === "object" &&
                "status" in payload.old &&
                isOrderPending(payload.old.status as string)
              ) {
                // It was a pending order that was deleted - decrement count
                setUnreadCount((prev) => Math.max(0, prev - 1));
                if ("id" in payload.old) {
                  setNotifications((prev) =>
                    prev.filter(
                      (item) =>
                        item.id !== (payload.old as NotificationOrder).id
                    )
                  );
                }
              }
            }

            // Only fetch pending orders if needed (removing this frequent fetch that's causing loops)
            // Instead of fetching on every change, rely on the real-time updates

            // Only animate and play sound for new pending orders
            if (
              isPending &&
              (payload.eventType === "INSERT" || payload.eventType === "UPDATE")
            ) {
              setAnimateBell(true);
              playNotificationSound();
              setTimeout(() => setAnimateBell(false), 2000);
            }
          }
        )
        .subscribe((status) => {
          setConnectionStatus(status);
          if (status === "SUBSCRIBED") {
            // Fetch initial data when subscription is established
            fetchPendingOrders();
          }
        });

      channelRef.current = channel;
    } catch (err) {
      console.error("Error setting up realtime subscription:", err);
      setError("Failed to set up realtime updates");
    }
  }, [user, playNotificationSound, fetchPendingOrders]);

  // Force badge update when unreadCount changes
  useEffect(() => {
    // Force the badge to update by setting a timeout
    const timer = setTimeout(() => {
      // This will trigger a re-render
      setUnreadCount((prev) => prev);
    }, 100);

    return () => clearTimeout(timer);
  }, [unreadCount]);

  // Initialize component with better cleanup and connection handling
  useEffect(() => {
    console.log("[NotificationBell] Component mounted");
    mountedRef.current = true;

    // Track if we've already set up the subscription to prevent duplicates
    let hasSetupSubscription = false;

    // Create Supabase client only once
    try {
      if (!supabaseRef.current) {
        const client = createClient();
        supabaseRef.current = client;
        console.log("[NotificationBell] Supabase client initialized");
      }
    } catch (err) {
      setError("Failed to initialize notification system");
      console.error("[NotificationBell] Failed to initialize Supabase client:", err);
      return;
    }

    // Only setup the subscription if we haven't already
    if (!hasSetupSubscription && !channelRef.current) {
      setupRealtimeSubscription();
      hasSetupSubscription = true;
    }

    // Initial data fetch with cooldown protection
    if (Date.now() - lastFetchTimeRef.current > 5000) {
      fetchPendingOrders();
    }

    // Comprehensive cleanup on unmount
    return () => {
      console.log("[NotificationBell] Component unmounting, cleaning up resources");
      mountedRef.current = false;

      // Properly remove the channel
      if (supabaseRef.current && channelRef.current) {
        try {
          supabaseRef.current.removeChannel(channelRef.current);
          console.log("[NotificationBell] Channel removed successfully");
        } catch (err) {
          console.warn("[NotificationBell] Error removing channel during cleanup:", err);
        }
        channelRef.current = null;
      }
    };
  }, [setupRealtimeSubscription, fetchPendingOrders]);

  // Handle notification click
  const handleNotificationClick = (orderId: string) => {
    router.push(`/dashboard/orders/${orderId}`);
    setUnreadCount((prev) => Math.max(0, prev - 1));
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
            <div className={cn(animateBell && "animate-bell")}>
              {animateBell ? (
                <BellRing className="h-6 w-6 text-red-500 animate-bell" />
              ) : (
                <Bell
                  className={cn(
                    "h-6 w-6",
                    unreadCount > 0 ? "text-red-500" : "text-amber-600"
                  )}
                />
              )}
              {!soundEnabled && (
                <VolumeX className="absolute bottom-0 right-0 h-3 w-3 text-gray-500" />
              )}
            </div>

            {/* Badge for unread count */}
            {(() => {
              // Force evaluation of the current unreadCount value
              const currentCount = unreadCount;
              // Use the current count for the badge
              return currentCount > 0 ? (
                <Badge
                  key={`badge-count-${currentCount}`} // Add key to force re-render
                  className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-red-500 text-white border-2 border-background animate-pulse"
                >
                  {currentCount > 99 ? "99+" : currentCount}
                </Badge>
              ) : null;
            })()}

            {/* Connection status indicator */}
            <span
              className={`absolute -bottom-1 -right-1 h-2 w-2 rounded-full ${connectionStatus === "SUBSCRIBED"
                ? "bg-green-500"
                : "bg-yellow-500"
                }`}
            />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-64 p-2">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-sm">
              Pending Orders
              <span
                className="text-xs font-normal text-gray-500 ml-1"
                key={`header-count-${unreadCount}`} // Add key to force re-render
              >
                {(() => {
                  // Force evaluation of the current unreadCount value
                  const currentCount = unreadCount;
                  // Use the current count for the dropdown header
                  return `(${currentCount})`;
                })()}
              </span>
            </h4>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSound}
              className="h-6 w-6"
              title={
                soundEnabled
                  ? "Mute notifications"
                  : "Enable notification sounds"
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
              {notifications.map((notification) => (
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
                onClick={() => router.push("/dashboard/orders")}
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
