'use client';

import { useEffect, useState, useCallback } from 'react';
import type { User, Subscription } from '@supabase/supabase-js';
import { Profile } from '@/lib/types/auth';
import { createClient } from '@/lib/supabase/client';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);
  const supabase = createClient();

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        return null;
      }

      return data;
    } catch (err) {
      return null;
    }
  }, [supabase]);

  // Initialize auth on first load
  useEffect(() => {
    let mounted = true;

    const getUser = async () => {
      try {
        // Using getUser which is the secure recommended method
        // Wrapping in try/catch to avoid uncaught errors
        try {
          const response = await supabase.auth.getUser();

          // Only proceed if component is still mounted
          if (!mounted) return;

          const currentUser = response.data?.user;

          if (currentUser) {
            setUser(currentUser);

            // Fetch user profile
            const profileData = await fetchProfile(currentUser.id);
            if (mounted && profileData) {
              setProfile(profileData as Profile);
            }
          }
        } catch (error) {
          // Silently handle errors without logging to console
        }
      } finally {
        if (mounted) {
          setLoading(false);
          setAuthInitialized(true);
        }
      }
    };

    // Load user data on first render
    getUser();

    // Set up auth change listener
    let subscription: Subscription | undefined;
    try {
      const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
        // Only proceed if component is still mounted
        if (!mounted) return;

        if (session?.user) {
          // Always revalidate the user on auth state changes with getUser for security
          try {
            const { data: userData } = await supabase.auth.getUser();
            if (mounted && userData.user) {
              setUser(userData.user);

              // Fetch updated profile data
              const profileData = await fetchProfile(userData.user.id);
              if (mounted && profileData) {
                setProfile(profileData as Profile);
              }
            }
          } catch (error) {
            // Silently handle errors
          }
        } else {
          if (mounted) {
            setUser(null);
            setProfile(null);
          }
        }
      });

      subscription = data?.subscription;
    } catch (error) {
      // Silently handle subscription setup errors
    }

    // Clean up subscription
    return () => {
      mounted = false;
      if (subscription) {
        try {
          subscription.unsubscribe();
        } catch (error) {
          // Silently handle unsubscribe errors
        }
      }
    };
  }, [supabase, fetchProfile]);

  return { user, profile, loading, authInitialized };
}
