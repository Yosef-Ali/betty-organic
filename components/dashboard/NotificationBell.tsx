"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import "@/styles/bell-animation.css";
import { Bell, BellRing, Volume2, VolumeX, Eye, CheckCircle, Clock, User, Phone, Mail, MapPin, ExternalLink } from "lucide-react";
import { NotificationSounds } from "@/lib/utils/notificationSounds";
import { useRouter } from "next/navigation";
import { cn, formatOrderCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
  const [readNotifications, setReadNotifications] = useState<Set<string>>(new Set());
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

  // Mark notification as read
  const markAsRead = useCallback((notificationId: string) => {
    setReadNotifications(prev => new Set([...prev, notificationId]));
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    const allIds = notifications.map(n => n.id);
    setReadNotifications(new Set(allIds));
    setUnreadCount(0);
  }, [notifications]);

  // Dismiss notification (remove from list)
  const dismissNotification = useCallback((notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    setReadNotifications(prev => {
      const newSet = new Set(prev);
      newSet.delete(notificationId);
      return newSet;
    });
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  // Handle notification click
  const handleNotificationClick = (orderId: string) => {
    markAsRead(orderId);
    router.push(`/dashboard/orders/${orderId}`);
  };

  // Handle quick view (mark as read without navigating)
  const handleQuickView = (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    markAsRead(notificationId);
  };

  // Get time ago string
  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'new': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'processing': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
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

        <DropdownMenuContent align="end" className="w-80 p-3">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="font-semibold text-sm">
                {profile?.role === 'customer' ? 'Your Orders' :
                  profile?.role === 'sales' ? 'Pending Orders' :
                    'All Notifications'}
              </h4>
              <p className="text-xs text-muted-foreground">
                {(() => {
                  const currentCount = roleBasedUnreadCount;
                  return currentCount > 0 ? `${currentCount} unread` : 'All caught up';
                })()}
              </p>
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="h-7 px-2 text-xs"
                  title="Mark all as read"
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Read All
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSound}
                className="h-7 w-7"
                title={
                  soundEnabled
                    ? "Mute notifications"
                    : "Enable notification sounds"
                }
              >
                {soundEnabled ? (
                  <Volume2 className="h-3 w-3" />
                ) : (
                  <VolumeX className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>

          <Separator className="mb-3" />

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
            <div className="max-h-[400px] overflow-y-auto space-y-2">
              {filteredNotifications.map((notification) => {
                const isRead = readNotifications.has(notification.id);
                return (
                  <div
                    key={notification.id}
                    className={cn(
                      "p-3 rounded-lg border transition-all duration-200 cursor-pointer",
                      isRead 
                        ? "bg-gray-50 border-gray-200 opacity-75" 
                        : "bg-white border-blue-200 shadow-sm hover:shadow-md hover:border-blue-300"
                    )}
                    onClick={() => handleNotificationClick(notification.id)}
                  >
                    <div className="flex items-start gap-3">
                      {/* Status indicator */}
                      <div className="relative">
                        <div className={cn(
                          "p-2 rounded-full transition-colors",
                          isRead ? "bg-gray-100 text-gray-500" : "bg-blue-100 text-blue-600"
                        )}>
                          <BellRing className="h-4 w-4" />
                        </div>
                        {!isRead && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex-1">
                            <h5 className={cn(
                              "font-medium text-sm",
                              isRead ? "text-gray-600" : "text-gray-900"
                            )}>
                              {profile?.role === 'customer' ? 'Your Order Update' : 'New Order Received'}
                            </h5>
                            <p className="text-xs text-muted-foreground">
                              {notification.display_id || `#${notification.id.slice(0, 8)}`}
                            </p>
                          </div>
                          <Badge 
                            className={cn(
                              "text-xs border",
                              getStatusColor(notification.status)
                            )}
                          >
                            {notification.status}
                          </Badge>
                        </div>

                        {/* Details */}
                        <div className="space-y-1 mb-3">
                          {/* Customer info for sales/admin */}
                          {(profile?.role === 'sales' || profile?.role === 'admin') && notification.customer_name && (
                            <div className="flex items-center gap-2 text-xs">
                              <User className="h-3 w-3 text-blue-500" />
                              <span className="font-medium text-blue-700">
                                {notification.customer_name}
                              </span>
                              {notification.customer_email && (
                                <span className="text-muted-foreground">
                                  ({notification.customer_email})
                                </span>
                              )}
                            </div>
                          )}

                          {/* Amount */}
                          {notification.total_amount && (
                            <div className="flex items-center gap-2 text-xs">
                              <span className="font-semibold text-green-600">
                                {formatOrderCurrency(notification.total_amount)}
                              </span>
                            </div>
                          )}

                          {/* Time */}
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{getTimeAgo(notification.created_at)}</span>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            className="h-7 px-3 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleNotificationClick(notification.id);
                            }}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View Order
                          </Button>
                          
                          {!isRead && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 px-3 text-xs"
                              onClick={(e) => handleQuickView(notification.id, e)}
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Mark Read
                            </Button>
                          )}

                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              dismissNotification(notification.id);
                            }}
                            title="Dismiss notification"
                          >
                            ×
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <Separator className="mt-3 mb-3" />
          
          {/* Footer actions */}
          <div className="space-y-3">
            {/* Main actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs"
                onClick={() => router.push("/dashboard/orders")}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                View All Orders
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={fetchNotifications}
                title="Refresh notifications"
              >
                Refresh
              </Button>
            </div>

            {/* Settings row */}
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-1 text-xs h-7"
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

              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  isConnected ? "bg-green-500" : "bg-yellow-500"
                )} />
                <span>{isConnected ? 'Live' : 'Connecting'}</span>
              </div>
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
