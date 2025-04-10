'use client';

import { useEffect } from 'react';
import { useUIStore } from '@/store/uiStore';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/providers/AuthProvider';

export function AppInitializer() {
  const { setCartOpen } = useUIStore();
  const { user, setUser, setProfile, setIsLoading } = useAuth();

  useEffect(() => {
    // Reset UI state on page load
    setCartOpen(false);

    const initApp = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        setIsLoading(true);

        const response = await fetch('/api/init', {
          signal: controller.signal,
          cache: 'no-store',
          credentials: 'include'
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          console.warn('App initialization received non-OK response:', response.status);
          return;
        }

        // Check the content type before trying to parse as JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          console.warn('App initialization received non-JSON response:', contentType);
          return;
        }

        const data = await response.json();

        if (data.session?.user) {
          setUser(data.session.user);
          setProfile(data.profile);
          console.log('Auth state initialized with user:', data.session.user.email);
        }

      } catch (error: unknown) {
        // Avoid crashing the app if initialization fails
        if (error instanceof Error && error.name === 'AbortError') {
          console.warn('App initialization timed out');
        } else {
          // Safely handle errors that may not be serializable
          const errorMessage = error instanceof Error
            ? error.message
            : 'Unknown initialization error';
          console.error('App initialization error:', errorMessage);
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (!user) {
      initApp();
    }

    // Listen for route changes to reset cart state
    const handleRouteChange = () => {
      setCartOpen(false);
    };

    window.addEventListener('popstate', handleRouteChange);

    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, [setCartOpen, user, setUser, setProfile, setIsLoading]);

  return null;
}
