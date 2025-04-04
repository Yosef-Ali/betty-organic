import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Bell, BellRing, Volume2, VolumeX } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

// Simple notification type
type Notification = {
  id: string;
  title: string;
  description: string;
  created_at: string;
};

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [animateBell, setAnimateBell] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>('SUBSCRIBED');
  const [soundEnabled, setSoundEnabled] = useState(true); // Default to enabled
  const router = useRouter();
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mountedRef = useRef(true); // Track component mount state

  // Play notification sound
  const playNotificationSound = useCallback(async () => {
    // Only play sound if enabled
    if (!soundEnabled) return;

    try {
      // If we don't have an audio element yet, create one
      if (!audioRef.current) {
        audioRef.current = new Audio('/sound/notification.mp3');
      }

      // Play the sound
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(e => {
        console.warn('Audio play failed:', e);
        // If play fails due to user interaction requirements, we'll just skip it
      });
    } catch (err) {
      console.warn('Notification sound error:', err);
    }
  }, [soundEnabled]);

  // Toggle sound settings and save to localStorage
  const toggleSound = useCallback(() => {
    const newSoundEnabled = !soundEnabled;
    setSoundEnabled(newSoundEnabled);

    // Save preference to localStorage
    try {
      localStorage.setItem(
        'notification_sound_enabled',
        newSoundEnabled ? 'true' : 'false',
      );
    } catch (err) {
      console.warn('Failed to save sound preference to localStorage:', err);
    }

    // Play a test sound if enabled
    if (newSoundEnabled) {
      playNotificationSound();
    }
  }, [soundEnabled, playNotificationSound]);

  // Load sound preference from localStorage on mount
  useEffect(() => {
    try {
      const savedPreference = localStorage.getItem('notification_sound_enabled');
      if (savedPreference !== null) {
        const isEnabled = savedPreference === 'true';
        setSoundEnabled(isEnabled);
      }
    } catch (err) {
      console.warn('Failed to load sound preference from localStorage:', err);
    }
  }, []);

  // Enhanced animation effect for the bell
  useEffect(() => {
    if (!animateBell) return;

    // Animate for 3 seconds
    const timer = setTimeout(() => setAnimateBell(false), 3000);
    return () => clearTimeout(timer);
  }, [animateBell]);

  // Create test notifications on mount
  useEffect(() => {
    mountedRef.current = true;
    
    // Create test notifications
    const testNotifications: Notification[] = [
      {
        id: 'test-1',
        title: 'New pending order',
        description: 'Order #12345 has been created',
        created_at: new Date().toISOString(),
      },
      {
        id: 'test-2',
        title: 'New pending order',
        description: 'Order #12346 has been created',
        created_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      },
      {
        id: 'test-3',
        title: 'New pending order',
        description: 'Order #12347 has been created',
        created_at: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
      },
    ];
    
    // Set notifications
    setNotifications(testNotifications);
    setUnreadCount(testNotifications.length);
    
    // Trigger animation and sound
    setAnimateBell(true);
    playNotificationSound();
    
    // Simulate new notifications periodically
    const interval = setInterval(() => {
      if (Math.random() < 0.3) { // 30% chance of new notification
        const newNotification: Notification = {
          id: `test-${Date.now()}`,
          title: 'New pending order',
          description: `Order #${Math.floor(Math.random() * 10000)} has been created`,
          created_at: new Date().toISOString(),
        };
        
        setNotifications(prev => [newNotification, ...prev.slice(0, 4)]); // Keep max 5
        setUnreadCount(prev => prev + 1);
        setAnimateBell(true);
        playNotificationSound();
      }
    }, 30000); // Every 30 seconds
    
    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, [playNotificationSound]);

  const handleNotificationClick = (id: string) => {
    // Simulate navigation to order details
    router.push(`/dashboard/orders/${id}`);
    
    // Reduce unread count
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative w-10 h-10 bg-yellow-50 hover:bg-yellow-100 border border-yellow-200 rounded-full"
          disabled={isLoading}
        >
          <div
            className={cn(animateBell && 'animate-bell')}
            title={
              soundEnabled
                ? 'Notification sounds on'
                : 'Notification sounds off'
            }
          >
            {/* Show animated bell or regular bell based on state */}
            {animateBell ? (
              <BellRing className="h-6 w-6 text-red-500 animate-bell" />
            ) : (
              <Bell
                className={cn(
                  'h-6 w-6',
                  unreadCount > 0 ? 'text-red-500' : 'text-yellow-600',
                )}
              />
            )}
            {!soundEnabled && (
              <div className="absolute bottom-0 right-0 h-2 w-2 bg-gray-400 rounded-full border border-background"></div>
            )}
          </div>
          {unreadCount > 0 && (
            <Badge
              className="absolute -right-1 -top-1 h-7 w-7 rounded-full p-0 flex items-center justify-center bg-red-500 text-white border-2 border-background animate-pulse"
              style={{ fontSize: '0.85rem', fontWeight: 'bold' }}
            >
              {unreadCount}
            </Badge>
          )}
          {/* Always show connection indicator with different colors based on status */}
          <span 
            className={`absolute -bottom-1 -right-1 h-2 w-2 rounded-full ${
              connectionStatus === 'SUBSCRIBED' ? 'bg-green-500' : 'bg-yellow-500'
            }`} 
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-2">
        <div className="flex items-center justify-between mb-2 px-2">
          <h4 className="font-semibold text-sm">Notifications</h4>
          <div className="flex items-center text-xs text-green-600">
            <span className="h-2 w-2 rounded-full bg-green-500 mr-1"></span>
            Live
          </div>
        </div>

        {error ? (
          <div className="p-3 text-red-500 bg-red-50 rounded-md mb-1">
            <div className="font-medium">Error</div>
            <div className="text-sm">{error}</div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            <div className="mb-2">📭</div>
            <div>No pending orders</div>
          </div>
        ) : (
          <div className="max-h-[300px] overflow-y-auto">
            {notifications.map(notification => (
              <DropdownMenuItem
                key={notification.id}
                onClick={() => handleNotificationClick(notification.id)}
                className="cursor-pointer mb-1 hover:bg-muted rounded-md"
              >
                <div className="flex items-start gap-2 w-full">
                  <div className="bg-yellow-100 text-yellow-800 p-2 rounded-full">
                    <BellRing className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col flex-1">
                    <div className="flex justify-between items-center w-full">
                      <span className="font-medium">
                        {notification.title}
                      </span>
                      <Badge variant="outline" className="ml-2 text-xs">
                        Pending
                      </Badge>
                    </div>
                    <span className="text-sm">{notification.description}</span>
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
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1">
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
                  onClick={playNotificationSound}
                  title="Test notification sound"
                >
                  Test
                </Button>
              )}
            </div>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
