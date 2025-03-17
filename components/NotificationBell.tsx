'use client';

import { Bell } from 'lucide-react';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSound } from 'use-sound';

export function NotificationBell() {
  const [hasNewOrder, setHasNewOrder] = useState(false);
  const [play] = useSound('/sounds/notification.mp3'); // You'll need to add this sound file

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

  useEffect(() => {
    // Listen for new online orders
    const handleNewOrder = (order: any) => {
      if (order.type === 'online') {
        setHasNewOrder(true);
        play(); // Play notification sound
      }
    };

    // Add your real-time listener here (e.g., WebSocket or Server-Sent Events)
    // This is just a placeholder
    const cleanup = subscribeToOrders(handleNewOrder);

    return () => cleanup();
  }, [play]);

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
