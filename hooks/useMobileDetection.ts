'use client';

import { useState, useEffect } from 'react';

/**
 * Hook to detect mobile devices based on screen width
 * Uses Tailwind's 'sm' breakpoint (640px) as the threshold
 */
export function useMobileDetection() {
  const [isMobile, setIsMobile] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Set client-side flag to avoid hydration mismatches
    setIsClient(true);
    
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640); // Tailwind's sm breakpoint
    };

    // Check on mount
    checkMobile();

    // Add event listener for window resize
    window.addEventListener('resize', checkMobile);

    // Cleanup
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Return false during SSR to avoid hydration mismatches
  return isClient ? isMobile : false;
}