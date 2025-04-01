'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { User } from '@supabase/auth-helpers-nextjs';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);
  const supabase = createClientComponentClient();

  // Initialize auth on first load
  useEffect(() => {
    const getUser = async () => {
      try {
        console.log('Initializing auth state');

        // Get current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('Session error:', sessionError);
          setLoading(false);
          return;
        }

        if (session?.user) {
          console.log('Found authenticated session');
          setUser(session.user);

          // Fetch user profile
          const { data, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profileError) {
            console.warn('Profile fetch error:', profileError);
          } else if (data) {
            console.log('Profile loaded successfully');
            setProfile(data);
          }
        } else {
          console.log('No authenticated session found');
        }
      } catch (error) {
        console.error('Error getting user:', error);
      } finally {
        setLoading(false);
        setAuthInitialized(true); // Mark auth as initialized regardless of outcome
      }
    };

    // Load user data on first render
    getUser();

    // Set up auth change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change event:', event);

      // Update user state
      setUser(session?.user ?? null);

      if (session?.user) {
        try {
          // Fetch updated profile data
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (error) {
            console.warn('Profile fetch error on auth change:', error);
          } else {
            setProfile(data);
          }
        } catch (err) {
          console.error('Error fetching profile on auth change:', err);
        }
      } else {
        setProfile(null);
      }
    });

    // Clean up subscription
    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  return { user, profile, loading, authInitialized };
}
