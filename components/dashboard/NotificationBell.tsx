"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import "@/styles/bell-animation.css";
import { Bell, BellRing, Volume2, VolumeX } from "lucide-react";
import { NotificationSounds } from "@/lib/utils/notificationSounds";
import { useRouter } from "next/navigation";
import { cn, formatOrderCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/providers/ImprovedAuthProvider";
import { useRealtime } from "@/lib/supabase/realtime-provider";
import {
  RoleBasedNotificationOrder,
  fetchRoleBasedNotifications,
} from "@/app/actions/roleBasedNotificationActions";
import { isOrderPending } from "@/app/utils/notificationUtils";

export function NotificationBell() {
  const [notifications, setNotifications] = useState<RoleBasedNotificationOrder[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [animateBell, setAnimateBell] = useState(false);
  const [animateBadge, setAnimateBadge] = useState(false);
  const [animateButton, setAnimateButton] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    try {
      const saved = localStorage.getItem("notification_sound");
      return saved !== null ? saved === "true" : true;
    } catch (e) {
      return true;
    }
  });

  const router = useRouter();
  const { user, profile } = useAuth();
  const { isConnected, connectionStatus, subscribeToOrders } = useRealtime();

  // Audio reference for notification sounds
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mountedRef = useRef(true);
  const lastFetchTimeRef = useRef<number>(0);

  // Play notification sound with enhanced effects
  const playNotificationSound = useCallback(async () => {
    if (!soundEnabled) return;

    try {
      await NotificationSounds.playNotification({
        sound: true,
        vibrate: false, // Enable on mobile if desired
        soundType: 'chime'
      });
    } catch (err) {
      console.warn("Enhanced notification sound failed:", err);
      // Fallback to simple audio
      try {
        const audio = new Audio("/sound/notification.mp3");
        audio.volume = 0.7;
        await audio.play();
      } catch (fallbackErr) {
        console.warn("Fallback audio also failed:", fallbackErr);
      }
    }
  }, [soundEnabled]);

  // Enhanced animation trigger
  const triggerNotificationAnimation = useCallback(() => {
    setAnimateBell(true);
    setAnimateBadge(true);
    setAnimateButton(true);

    // Reset animations after they complete
    setTimeout(() => {
      setAnimateBell(false);
      setAnimateBadge(false);
    }, 1500); // Bell and badge animation duration

    setTimeout(() => {
      setAnimateButton(false);
    }, 3000); // Button animation duration
  }, []);

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

  // Fetch role-based notifications with cooldown protection
  const fetchNotifications = useCallback(async () => {
    if (!mountedRef.current || !user?.id || !profile?.role) return;

    // Add cooldown of 30 seconds to prevent excessive API calls
    const now = Date.now();
    const cooldownPeriod = 30000;

    if (now - lastFetchTimeRef.current < cooldownPeriod) {
      console.log("[NotificationBell] Skipping fetch - cooldown period active");
      return;
    }

    lastFetchTimeRef.current = now;
    setIsLoading(true);

    try {
      const response = await fetchRoleBasedNotifications(user.id, profile.role);

      if (!response.success) {
        setError(response.error || "Failed to load notifications");
        setNotifications([]);
        setUnreadCount(0);
        return;
      }

      if (mountedRef.current) {
        setNotifications(response.orders);
        // The server action already filters by role, so use the count directly
        setUnreadCount(response.count);
        setError(null);
      }
    } catch (err) {
      if (mountedRef.current) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        setError(`Failed to load notifications: ${errorMessage}`);
        setNotifications([]);
        setUnreadCount(0);
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [user, profile]);

  // Handle realtime order updates with role-based logic
  const handleOrderUpdate = useCallback((order: any, event: 'INSERT' | 'UPDATE' | 'DELETE') => {
    console.log('[NotificationBell] 🔔 Received event:', {
      event,
      orderId: order.id,
      status: order.status,
      userRole: profile?.role,
      userId: user?.id,
      mounted: mountedRef.current,
      currentNotificationsCount: notifications.length,
      currentUnreadCount: unreadCount
    });

    if (!mountedRef.current) {
      console.log('[NotificationBell] ❌ Not mounted, skipping');
      return;
    }

    // Handle new orders based on user role
    if (event === 'INSERT') {
      // Check if we have user and profile context
      if (!user?.id || !profile?.role) {
        console.log('[NotificationBell] ❌ Missing user context, skipping notification');
        return;
      }

      const userRole = profile.role;
      const isPending = isOrderPending(order.status);
      let shouldAddNotification = false;

      if (userRole === 'customer') {
        shouldAddNotification = order.customer_profile_id === user.id && isPending;
      } else if (userRole === 'sales' || userRole === 'admin') {
        shouldAddNotification = isPending;
      }

      if (shouldAddNotification) {
        console.log('[NotificationBell] ✅ Adding notification for order:', order.id);
        setNotifications(prev => {
          const newNotifications = [order as RoleBasedNotificationOrder, ...prev];
          console.log('[NotificationBell] 📊 Notifications count:', prev.length, '→', newNotifications.length);
          return newNotifications;
        });
        setUnreadCount(prev => {
          const newCount = prev + 1;
          console.log('[NotificationBell] 📊 Unread count:', prev, '→', newCount);
          return newCount;
        });
        triggerNotificationAnimation();
        playNotificationSound();
        console.log('[NotificationBell] 🎵 Sound and animation triggered');
      } else {
        console.log('[NotificationBell] ❌ Not adding notification:', {
          orderId: order.id,
          userRole,
          isPending,
          shouldAdd: shouldAddNotification,
          customerProfileId: order.customer_profile_id,
          currentUserId: user.id
        });
      }
    } else if (event === 'UPDATE') {
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === order.id ? order as RoleBasedNotificationOrder : notification
        )
      );
    } else if (event === 'DELETE') {
      setNotifications(prev => prev.filter(notification => notification.id !== order.id));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  }, [playNotificationSound, profile, user, triggerNotificationAnimation, notifications.length, unreadCount]);

  // Force badge update when unreadCount changes
  useEffect(() => {
    // Force the badge to update by setting a timeout
    const timer = setTimeout(() => {
      // This will trigger a re-render
      setUnreadCount((prev) => prev);
    }, 100);

    return () => clearTimeout(timer);
  }, [unreadCount]);

  // Subscribe to realtime updates and fetch initial data
  useEffect(() => {
    mountedRef.current = true;

    // Subscribe to realtime order updates
    const unsubscribe = subscribeToOrders(handleOrderUpdate);

    // Fetch initial data only once on mount
    fetchNotifications();

    return () => {
      mountedRef.current = false;
      unsubscribe();
    };
  }, [subscribeToOrders, handleOrderUpdate, fetchNotifications]);

  // The server action already filters notifications by role, so we use them directly
  // Only filter out completed orders that might have been included
  const filteredNotifications = notifications.filter((notification) => {
    return isOrderPending(notification.status);
  });

  const roleBasedUnreadCount = unreadCount;

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
            className={cn(
              "relative w-10 h-10 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-full shadow-sm transition-all duration-200 hover:shadow",
              animateButton && "animate-button-pulse"
            )}
            disabled={isLoading}
          >
            <div className={cn(
              "relative transition-all duration-200",
              animateBell && "animate-bell"
            )}>
              {animateBell ? (
                <BellRing className="h-6 w-6 text-red-500 drop-shadow-lg" />
              ) : (
                <Bell
                  className={cn(
                    "h-6 w-6 transition-colors duration-200",
                    unreadCount > 0 ? "text-red-500 drop-shadow-md" : "text-amber-600"
                  )}
                />
              )}
              {!soundEnabled && (
                <VolumeX className="absolute -bottom-1 -right-1 h-3 w-3 text-gray-500 bg-white rounded-full p-0.5" />
              )}
            </div>

            {/* Badge for unread count */}
            {(() => {
              // Use role-based count for the badge
              const currentCount = roleBasedUnreadCount;
              return currentCount > 0 ? (
                <Badge
                  key={`badge-count-${currentCount}`}
                  className={cn(
                    "absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-red-500 text-white border-2 border-background animate-pulse",
                    animateBadge && "animate-badge"
                  )}
                >
                  {currentCount > 99 ? "99+" : currentCount}
                </Badge>
              ) : null;
            })()}

            {/* Connection status indicator */}
            <span
              className={`absolute -bottom-1 -right-1 h-2 w-2 rounded-full ${isConnected ? "bg-green-500" : "bg-yellow-500"
                }`}
            />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-64 p-2">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-sm">
              {profile?.role === 'customer' ? 'Your Orders' :
                profile?.role === 'sales' ? 'Pending Orders' :
                  'All Notifications'}
              <span
                className="text-xs font-normal text-gray-500 ml-1"
                key={`header-count-${roleBasedUnreadCount}`}
              >
                {(() => {
                  const currentCount = roleBasedUnreadCount;
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
          ) : filteredNotifications.length === 0 ? (
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
              {filteredNotifications.map((notification) => (
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
                          {profile?.role === 'customer' ? 'Your Order' : 'New Order'}
                        </span>
                        <Badge variant="outline" className="ml-2 text-xs capitalize">
                          {notification.status}
                        </Badge>
                      </div>

                      <div className="text-xs font-medium">
                        {notification.display_id ||
                          `Order #${notification.id.slice(0, 8)}`}
                      </div>

                      {/* Show customer info for sales/admin */}
                      {(profile?.role === 'sales' || profile?.role === 'admin') && notification.customer_name && (
                        <div className="text-xs text-blue-600 font-medium">
                          Customer: {notification.customer_name}
                        </div>
                      )}

                      {notification.total_amount && (
                        <div className="text-xs text-muted-foreground">
                          {formatOrderCurrency(notification.total_amount)}
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

              <Button
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={() => {
                  triggerNotificationAnimation();
                  if (soundEnabled) {
                    playNotificationSound();
                  }
                }}
                title="Test notification animation and sound"
              >
                {soundEnabled ? 'Test Sound & Animation' : 'Test Animation'}
              </Button>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-between mt-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={fetchNotifications}
                title="Manually refresh notifications"
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
