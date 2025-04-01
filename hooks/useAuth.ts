'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { User } from '@supabase/auth-helpers-nextjs';
import { Profile } from '@/lib/types/auth';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);
  const supabase = createClientComponentClient();

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.warn('Profile fetch error:', error);
        return null;
      }

      return data;
    } catch (err) {
      console.error('Error fetching profile:', err);
      return null;
    }
  }, [supabase]);

  // Initialize auth on first load
  useEffect(() => {
    let mounted = true;

    const getUser = async () => {
      try {
        console.log('Initializing auth state');

        // Get current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('Session error:', sessionError);
          if (mounted) {
            setLoading(false);
            setAuthInitialized(true);
          }
          return;
        }

        if (session?.user) {
          console.log('Found authenticated session');
          if (mounted) setUser(session.user);

          // Fetch user profile
          const profileData = await fetchProfile(session.user.id);
          if (profileData && mounted) {
            console.log('Profile loaded successfully');
            setProfile(profileData as Profile);
          }
        } else {
          console.log('No authenticated session found');
        }
      } catch (error) {
        console.error('Error getting user:', error);
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change event:', event);

      if (mounted) {
        // Update user state
        setUser(session?.user ?? null);

        if (session?.user) {
          // Fetch updated profile data
          const profileData = await fetchProfile(session.user.id);
          if (mounted && profileData) {
            setProfile(profileData as Profile);
          } else if (mounted) {
            setProfile(null);
          }
        } else if (mounted) {
          setProfile(null);
        }
      }
    });

    // Clean up subscription
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, fetchProfile]);

  return { user, profile, loading, authInitialized };
}
