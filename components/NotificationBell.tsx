'use client';

import { Bell } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function NotificationBell() {
  const [hasNewOrder, setHasNewOrder] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Animation for the bell
  const bellAnimation = {
    initial: { rotate: 0 },
    animate: {
      rotate: [0, 15, -15, 0],
      transition: { duration: 0.5 }
    }
  };

  // Notification dot animation
  const dotAnimation = {
    initial: { scale: 0 },
    animate: { scale: 1 },
    exit: { scale: 0 }
  };

  // Function to play notification sound
  const playNotificationSound = () => {
    try {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.volume = 1.0;
        audioRef.current.play().catch(error => {
          console.error('Error playing notification sound:', error);
        });
      }
    } catch (error) {
      console.error('Failed to play notification sound:', error);
    }
  };

  useEffect(() => {
    // Initialize audio element
    audioRef.current = new Audio('/notification.mp3');

    // Listen for new online orders
    const handleNewOrder = (order: any) => {
      if (order.type === 'online') {
        setHasNewOrder(true);
        playNotificationSound();
      }
    };

    // Add your real-time listener here (e.g., WebSocket or Server-Sent Events)
    // This is just a placeholder
    const cleanup = subscribeToOrders(handleNewOrder);

    return () => cleanup();
  }, []);

  return (
    <div className="relative">
      <motion.div
        initial="initial"
        animate={hasNewOrder ? "animate" : "initial"}
        variants={bellAnimation}
      >
        <Bell className="h-6 w-6" />
      </motion.div>

      <AnimatePresence>
        {hasNewOrder && (
          <motion.div
            className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-500"
            initial="initial"
            animate="animate"
            exit="exit"
            variants={dotAnimation}
          />
        )}
      </AnimatePresence>

      {/* Hidden audio element as fallback */}
      <audio id="notificationSound" src="/notification.mp3" preload="auto" style={{ display: 'none' }} />
    </div>
  );
}

// Helper function to subscribe to orders (implement based on your backend)
function subscribeToOrders(callback: (order: any) => void) {
  // Implement your real-time subscription logic here
  return () => {
    // Cleanup function
  };
}
