'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bell, BellRing, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function SimpleNotificationBell() {
  // Simple state
  const [count, setCount] = useState(3); // Start with 3 notifications
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showAnimation, setShowAnimation] = useState(false);
  
  // Audio reference
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Play notification sound
  const playSound = () => {
    if (!soundEnabled) return;
    
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio('/sound/notification.mp3');
      }
      
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(err => {
        console.warn('Failed to play sound:', err);
      });
    } catch (err) {
      console.warn('Error playing sound:', err);
    }
  };
  
  // Toggle sound setting
  const toggleSound = () => {
    setSoundEnabled(!soundEnabled);
    
    // Save to localStorage
    try {
      localStorage.setItem('notification_sound', (!soundEnabled).toString());
    } catch (err) {
      console.warn('Failed to save sound setting:', err);
    }
    
    // Play test sound if enabling
    if (!soundEnabled) {
      playSound();
    }
  };
  
  // Load sound setting from localStorage on mount
  useEffect(() => {
    try {
      const savedSetting = localStorage.getItem('notification_sound');
      if (savedSetting !== null) {
        setSoundEnabled(savedSetting === 'true');
      }
    } catch (err) {
      console.warn('Failed to load sound setting:', err);
    }
    
    // Initial animation
    setShowAnimation(true);
    setTimeout(() => setShowAnimation(false), 2000);
    
    // Simulate new notifications periodically
    const interval = setInterval(() => {
      if (Math.random() < 0.3) { // 30% chance of new notification
        setCount(prev => prev + 1);
        setShowAnimation(true);
        playSound();
        
        // Stop animation after 2 seconds
        setTimeout(() => setShowAnimation(false), 2000);
      }
    }, 30000); // Every 30 seconds
    
    return () => clearInterval(interval);
  }, []);
  
  // Mark all as read
  const markAllAsRead = () => {
    setCount(0);
  };
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative w-10 h-10 bg-yellow-50 hover:bg-yellow-100 border border-yellow-200 rounded-full"
        >
          {showAnimation ? (
            <BellRing className="h-6 w-6 text-red-500 animate-bell" />
          ) : (
            <Bell
              className={`h-6 w-6 ${count > 0 ? 'text-red-500' : 'text-yellow-600'}`}
            />
          )}
          
          {/* Notification count badge */}
          {count > 0 && (
            <Badge
              className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-red-500 text-white border-2 border-background"
            >
              {count}
            </Badge>
          )}
          
          {/* Connection indicator */}
          <span className="absolute -bottom-1 -right-1 h-2 w-2 rounded-full bg-green-500" />
          
          {/* Sound indicator */}
          {!soundEnabled && (
            <span className="absolute bottom-0 right-0 h-2 w-2 bg-gray-400 rounded-full" />
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-64 p-2">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold text-sm">Notifications</h4>
          <div className="flex items-center text-xs text-green-600">
            <span className="h-2 w-2 rounded-full bg-green-500 mr-1"></span>
            Live
          </div>
        </div>
        
        {count === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            <div className="mb-2">📭</div>
            <div>No pending orders</div>
          </div>
        ) : (
          <div className="space-y-2 mb-2">
            {Array.from({ length: count }).map((_, i) => (
              <DropdownMenuItem key={i} className="cursor-pointer">
                <div className="flex items-start gap-2 w-full">
                  <div className="bg-yellow-100 text-yellow-800 p-2 rounded-full">
                    <BellRing className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-medium">New pending order</div>
                    <div className="text-sm">Order #{1000 + i} needs attention</div>
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
            
            <DropdownMenuItem 
              className="w-full justify-center font-medium text-sm"
              onClick={markAllAsRead}
            >
              Mark all as read
            </DropdownMenuItem>
          </div>
        )}
        
        <div className="pt-2 border-t border-muted">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-xs"
            onClick={toggleSound}
          >
            {soundEnabled ? (
              <>
                <Volume2 className="mr-2 h-4 w-4" />
                Sound On
              </>
            ) : (
              <>
                <VolumeX className="mr-2 h-4 w-4" />
                Sound Off
              </>
            )}
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
