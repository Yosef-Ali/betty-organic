'use client';

import { useEffect } from 'react';
import { useUIStore } from '@/store/uiStore';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/providers/ImprovedAuthProvider';

export function AppInitializer() {
  const { setCartOpen } = useUIStore();
  const { user } = useAuth();

  useEffect(() => {
    // Reset UI state on page load
    setCartOpen(false);

    // ImprovedAuthProvider handles auth initialization automatically
    // Just reset UI state

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
