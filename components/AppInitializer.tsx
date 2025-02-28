'use client';

import { useEffect } from 'react';
import { useUIStore } from '@/store/uiStore';

export function AppInitializer() {
  const { setCartOpen } = useUIStore();
  
  useEffect(() => {
    // Reset UI state on page load
    setCartOpen(false);
    
    const initApp = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch('/api/init', {
          signal: controller.signal,
          cache: 'no-store',
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          console.warn('App initialization received non-OK response:', response.status);
        } else {
          console.log('App successfully initialized');
        }
      } catch (error: unknown) {
        // Avoid crashing the app if initialization fails
        if (error instanceof Error && error.name === 'AbortError') {
          console.warn('App initialization timed out');
        } else {
          console.error('App initialization error:', error);
        }
      }
    };

    initApp();
    
    // Listen for route changes to reset cart state
    const handleRouteChange = () => {
      setCartOpen(false);
    };

    window.addEventListener('popstate', handleRouteChange);

    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, [setCartOpen]);

  return null;
}
