"use client";

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Bell, BellRing, Volume2, VolumeX, Settings, Trash2, MarkAsUnread, Check, Clock, ShoppingCart, Users, Package } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useRealtime } from "@/lib/supabase/realtime-provider";
import { formatOrderCurrency, formatOrderId } from "@/lib/utils";
import { format } from "date-fns";
import {
  fetchRoleBasedNotifications,
  RoleBasedNotificationOrder,
} from "@/app/actions/roleBasedNotificationActions";
import { isOrderPending } from "@/app/utils/notificationUtils";

interface NotificationItem {
  id: string;
  type: 'order' | 'system' | 'customer';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
  order?: RoleBasedNotificationOrder;
}

export function NotificationsContent() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'unread' | 'orders' | 'system'>('all');
  const [debugInfo, setDebugInfo] = useState<string>('');
  
  const { user, profile } = useAuth();
  const { subscribeToOrders, isConnected } = useRealtime();

  // Load notification settings from localStorage
  useEffect(() => {
    try {
      const soundSetting = localStorage.getItem("notification_sound");
      const emailSetting = localStorage.getItem("notification_email");
      const pushSetting = localStorage.getItem("notification_push");
      
      setSoundEnabled(soundSetting !== null ? soundSetting === "true" : true);
      setEmailNotifications(emailSetting !== null ? emailSetting === "true" : true);
      setPushNotifications(pushSetting !== null ? pushSetting === "true" : true);
    } catch (e) {
      console.warn('Failed to load notification settings:', e);
    }
  }, []);

  // Save notification settings
  const updateSetting = useCallback((key: string, value: boolean) => {
    try {
      localStorage.setItem(key, value.toString());
    } catch (e) {
      console.warn('Failed to save notification setting:', e);
    }
  }, []);

  // Convert order to notification item
  const orderToNotification = useCallback((order: RoleBasedNotificationOrder, isNew = false): NotificationItem => {
    const getOrderMessage = () => {
      if (isNew) {
        return `New order ${formatOrderId(order.display_id || order.id)} for ${formatOrderCurrency(order.total_amount)}`;
      }
      
      switch (order.status?.toLowerCase()) {
        case 'confirmed':
          return `Order ${formatOrderId(order.display_id || order.id)} has been confirmed`;
        case 'processing':
          return `Order ${formatOrderId(order.display_id || order.id)} is being processed`;
        case 'ready':
          return `Order ${formatOrderId(order.display_id || order.id)} is ready for pickup`;
        case 'completed':
          return `Order ${formatOrderId(order.display_id || order.id)} has been completed`;
        case 'cancelled':
          return `Order ${formatOrderId(order.display_id || order.id)} has been cancelled`;
        default:
          return `Order ${formatOrderId(order.display_id || order.id)} status updated to ${order.status}`;
      }
    };

    const getPriority = (): 'low' | 'medium' | 'high' => {
      if (order.status?.toLowerCase() === 'cancelled') return 'high';
      if (isOrderPending(order.status)) return 'medium';
      return 'low';
    };

    return {
      id: `order-${order.id}-${Date.now()}`,
      type: 'order',
      title: isNew ? 'New Order' : 'Order Update',
      message: getOrderMessage(),
      timestamp: new Date(order.created_at),
      read: false,
      priority: getPriority(),
      order
    };
  }, []);

  // Fetch initial notifications
  const fetchNotifications = useCallback(async () => {
    if (!user || !profile) {
      console.log('[NotificationsContent] No user or profile available', { 
        hasUser: !!user, 
        hasProfile: !!profile, 
        userEmail: user?.email || 'none',
        profileRole: profile?.role || 'none'
      });
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetchRoleBasedNotifications(user.id, profile.role);
      
      if (response.success && response.notifications) {
        const notificationItems = response.notifications.map(order => 
          orderToNotification(order, false)
        );
        
        // Add some system notifications based on role
        const systemNotifications: NotificationItem[] = [];
        
        if (profile.role === 'admin') {
          systemNotifications.push({
            id: 'system-welcome-admin',
            type: 'system',
            title: 'Welcome to Admin Dashboard',
            message: 'You have full access to all features and reports.',
            timestamp: new Date(),
            read: true,
            priority: 'low'
          });
        } else if (profile.role === 'sales') {
          systemNotifications.push({
            id: 'system-welcome-sales',
            type: 'system',
            title: 'Sales Dashboard Ready',
            message: 'You can manage pending orders and customer inquiries.',
            timestamp: new Date(),
            read: true,
            priority: 'low'
          });
        }

        setNotifications([...notificationItems, ...systemNotifications]);
      } else {
        setError(response.error || 'Failed to load notifications');
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [user, profile, orderToNotification]);

  // Handle realtime order updates
  const handleOrderUpdate = useCallback((order: any, event: 'INSERT' | 'UPDATE' | 'DELETE') => {
    console.log('[NotificationsContent] Received realtime update:', { 
      event, 
      orderId: order.id, 
      status: order.status, 
      userRole: profile?.role,
      hasUser: !!user,
      hasProfile: !!profile,
      userEmail: user?.email || 'none'
    });
    
    // Store all orders initially, filter later when auth is available
    const newNotification = orderToNotification(order, event === 'INSERT');
    console.log('[NotificationsContent] Adding notification (will filter by role later):', newNotification);
    
    if (event === 'INSERT') {
      setNotifications(prev => {
        const updated = [newNotification, ...prev.slice(0, 49)];
        console.log('[NotificationsContent] Notifications updated, total count:', updated.length);
        return updated;
      });
      
      // Play sound for new notifications (if auth is available and should notify)
      if (soundEnabled && profile?.role) {
        const userRole = profile.role;
        let shouldPlaySound = false;
        
        if (userRole === 'customer') {
          shouldPlaySound = order.customer_profile_id === user?.id;
        } else if (userRole === 'sales') {
          shouldPlaySound = ['pending', 'new', 'processing'].includes(order.status?.toLowerCase());
        } else if (userRole === 'admin') {
          shouldPlaySound = true; // Admin gets all notifications
        }
        
        if (shouldPlaySound) {
          try {
            const audio = new Audio('/notification.mp3');
            audio.volume = 0.3;
            audio.play().catch(() => {
              // Fallback to system beep or silent fail
            });
          } catch (e) {
            // Silent fail for audio
          }
        }
      }
    } else if (event === 'UPDATE') {
      setNotifications(prev => 
        prev.map(notification => 
          notification.order?.id === order.id ? newNotification : notification
        )
      );
    } else if (event === 'DELETE') {
      setNotifications(prev => prev.filter(notification => notification.order?.id !== order.id));
    }
  }, [orderToNotification, soundEnabled, profile, user]);

  // Debug function to test notifications (defined after handleOrderUpdate)
  const testNotification = useCallback(() => {
    const testOrder = {
      id: 'test-' + Date.now(),
      display_id: 'TEST-123',
      total_amount: 99.99,
      status: 'pending',
      created_at: new Date().toISOString(),
      customer_profile_id: 'test-customer'
    };
    
    setDebugInfo(`Testing notification for ${profile?.role || 'unknown role'}...`);
    handleOrderUpdate(testOrder, 'INSERT');
    
    setTimeout(() => setDebugInfo(''), 3000);
  }, [handleOrderUpdate, profile]);

  // Subscribe to realtime updates (same pattern as NotificationBell)
  useEffect(() => {
    console.log('[NotificationsContent] Setting up realtime subscription');
    
    // Subscribe immediately like NotificationBell does
    const unsubscribe = subscribeToOrders(handleOrderUpdate);
    
    return unsubscribe;
  }, [subscribeToOrders, handleOrderUpdate]);

  // Separate effect for fetching initial data when auth becomes available
  useEffect(() => {
    if (user && profile) {
      console.log('[NotificationsContent] Auth available, fetching initial notifications');
      fetchNotifications();
    }
  }, [user, profile, fetchNotifications]);

  // Mark notification as read
  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
  }, []);

  // Delete notification
  const deleteNotification = useCallback((notificationId: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
  }, []);

  // Clear all notifications
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Filter notifications by role and then by selected filter
  const filteredNotifications = notifications.filter(notif => {
    // First apply role-based filtering (if auth is available)
    if (profile?.role && notif.type === 'order' && notif.order) {
      const userRole = profile.role;
      let shouldShow = false;
      
      if (userRole === 'customer') {
        // Customers see only their own pending orders
        const isPending = isOrderPending(notif.order.status);
        shouldShow = notif.order.customer_profile_id === user?.id && isPending;
      } else if (userRole === 'sales') {
        // Sales users see all pending orders
        shouldShow = isOrderPending(notif.order.status);
      } else if (userRole === 'admin') {
        // Admin sees all pending orders (not completed ones)
        shouldShow = isOrderPending(notif.order.status);
      }
      
      if (!shouldShow) return false;
    }
    
    // Then apply selected filter
    switch (selectedFilter) {
      case 'unread':
        return !notif.read;
      case 'orders':
        return notif.type === 'order';
      case 'system':
        return notif.type === 'system';
      default:
        return true;
    }
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type: string, priority: string) => {
    if (type === 'order') {
      return <ShoppingCart className={`h-4 w-4 ${priority === 'high' ? 'text-red-500' : priority === 'medium' ? 'text-yellow-500' : 'text-blue-500'}`} />;
    } else if (type === 'customer') {
      return <Users className="h-4 w-4 text-green-500" />;
    } else {
      return <Package className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-500';
      case 'medium': return 'text-yellow-500';
      default: return 'text-gray-500';
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show authentication required message only if we're sure there's no auth
  if (!loading && (!user || !profile)) {
    console.log('[NotificationsContent] Auth state:', { 
      hasUser: !!user, 
      hasProfile: !!profile, 
      loading,
      userEmail: user?.email || 'none',
      profileRole: profile?.role || 'none'
    });
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="p-6 text-center">
            <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">Authentication Required</h3>
            <p className="text-muted-foreground mb-4">
              Please log in to view your notifications.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="p-6 text-center">
            <Bell className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <h3 className="text-lg font-medium mb-2 text-red-600">Error Loading Notifications</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchNotifications} variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Notification Settings
          </CardTitle>
          <CardDescription>
            Manage how you receive notifications and alerts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              <span className="text-sm font-medium">Sound Notifications</span>
            </div>
            <Switch
              checked={soundEnabled}
              onCheckedChange={(checked) => {
                setSoundEnabled(checked);
                updateSetting("notification_sound", checked);
              }}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span className="text-sm font-medium">Push Notifications</span>
            </div>
            <Switch
              checked={pushNotifications}
              onCheckedChange={(checked) => {
                setPushNotifications(checked);
                updateSetting("notification_push", checked);
              }}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BellRing className="h-4 w-4" />
              <span className="text-sm font-medium">Email Notifications</span>
            </div>
            <Switch
              checked={emailNotifications}
              onCheckedChange={(checked) => {
                setEmailNotifications(checked);
                updateSetting("notification_email", checked);
              }}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Connection Status</p>
              <p className="text-xs text-muted-foreground">
                {isConnected ? 'Connected to real-time updates' : 'Connecting...'}
              </p>
              <p className="text-xs text-muted-foreground">
                User: {user?.email || 'Not logged in'} | Role: {profile?.role || 'No role'}
              </p>
            </div>
            <Badge variant={isConnected ? "default" : "secondary"}>
              {isConnected ? 'Live' : 'Offline'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Notification History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {unreadCount}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Recent notifications and alerts for your account
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={testNotification}>
                Test Notification
              </Button>
              {unreadCount > 0 && (
                <Button variant="outline" size="sm" onClick={markAllAsRead}>
                  <Check className="h-4 w-4 mr-2" />
                  Mark All Read
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={clearAllNotifications}>
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            </div>
            {debugInfo && (
              <div className="text-sm text-blue-600 mt-2">
                {debugInfo}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Filter Tabs */}
          <div className="flex items-center gap-2 mb-4">
            {[
              { key: 'all', label: 'All', count: notifications.length },
              { key: 'unread', label: 'Unread', count: unreadCount },
              { key: 'orders', label: 'Orders', count: notifications.filter(n => n.type === 'order').length },
              { key: 'system', label: 'System', count: notifications.filter(n => n.type === 'system').length }
            ].map(filter => (
              <Button
                key={filter.key}
                variant={selectedFilter === filter.key ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedFilter(filter.key as any)}
                className="text-xs"
              >
                {filter.label}
                {filter.count > 0 && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {filter.count}
                  </Badge>
                )}
              </Button>
            ))}
          </div>

          {/* Notifications List */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredNotifications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No notifications found</p>
                <p className="text-sm">You&apos;re all caught up!</p>
              </div>
            ) : (
              filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-lg border transition-colors ${
                    notification.read ? 'bg-muted/30' : 'bg-background'
                  } hover:bg-muted/50`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      {getNotificationIcon(notification.type, notification.priority)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-medium ${!notification.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {notification.title}
                          </p>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getPriorityColor(notification.priority)}`}
                          >
                            {notification.priority}
                          </Badge>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {format(notification.timestamp, 'MMM dd, yyyy HH:mm')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsRead(notification.id)}
                          className="h-8 w-8 p-0"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteNotification(notification.id)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}