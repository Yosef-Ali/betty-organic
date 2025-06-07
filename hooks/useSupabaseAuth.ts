'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import type { Profile } from '@/lib/types/auth';

export function useSupabaseAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const supabase = createClient();

  useEffect(() => {
    let mounted = true;

    // Get initial session
    const getSession = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.warn('Session error:', sessionError);
          if (mounted) {
            setUser(null);
            setProfile(null);
            setError(sessionError);
          }
          return;
        }

        if (session?.user) {
          if (mounted) {
            setUser(session.user);
          }

          // Fetch profile
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (mounted) {
            if (profileError) {
              console.warn('Profile fetch error:', profileError);
              setProfile(null);
            } else {
              setProfile(profileData);
            }
          }
        } else {
          if (mounted) {
            setUser(null);
            setProfile(null);
          }
        }
      } catch (err) {
        console.warn('Auth initialization error:', err);
        if (mounted) {
          setError(err as Error);
          setUser(null);
          setProfile(null);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.id);
        
        if (session?.user) {
          if (mounted) {
            setUser(session.user);
          }

          // Fetch fresh profile data
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (mounted) {
            if (profileError) {
              console.warn('Profile fetch error on auth change:', profileError);
              setProfile(null);
            } else {
              setProfile(profileData);
            }
          }
        } else {
          if (mounted) {
            setUser(null);
            setProfile(null);
          }
        }

        if (mounted) {
          setIsLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Refresh profile data
  const refreshProfile = async () => {
    if (!user?.id) return null;

    try {
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.warn('Profile refresh error:', error);
        return null;
      }

      setProfile(profileData);
      return profileData;
    } catch (err) {
      console.warn('Profile refresh exception:', err);
      return null;
    }
  };

  return {
    user,
    profile,
    isLoading,
    error,
    refreshProfile,
    supabase
  };
}