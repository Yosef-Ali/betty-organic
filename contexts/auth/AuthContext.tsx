'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { logAuthEvent } from '@/lib/utils';

interface Profile {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'sales' | 'customer';
  status: 'active' | 'inactive';
  auth_provider?: string;
  avatar_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AuthContextType {
  isAdmin: boolean;
  isSales: boolean;
  isCustomer: boolean;
  loading: boolean;
  profile: Profile | null;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
  isAdmin: false,
  isSales: false,
  isCustomer: false,
  loading: true,
  profile: null,
  isAuthenticated: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const supabase = createClientComponentClient();

  const loadProfile = async (userId: string) => {
    try {
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Profile fetch error:', error.message);
        return null;
      }

      if (!profileData) {
        console.warn('No profile found for user:', userId);
        return null;
      }

      return profileData;
    } catch (error) {
      console.error('Profile load error:', error);
      return null;
    }
  };

  const updateProfile = async (newProfile: Profile | null) => {
    try {
      // Only update state if profile actually changed
      if (JSON.stringify(newProfile) !== JSON.stringify(profile)) {
        setProfile(newProfile);
        setIsAuthenticated(!!newProfile);

        // Update localStorage after state change
        if (newProfile) {
          localStorage.setItem('userProfile', JSON.stringify(newProfile));
        } else {
          localStorage.removeItem('userProfile');
        }
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    }
    // Ensure loading state is cleared
    if (loading) {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        setLoading(true);

        // First check localStorage for profile
        const savedProfile = localStorage.getItem('userProfile');
        if (savedProfile) {
          const parsedProfile = JSON.parse(savedProfile);
          setProfile(parsedProfile);
          setIsAuthenticated(true);
        }

        // Then verify with Supabase
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          throw error;
        }

        if (!session?.user?.id) {
          await updateProfile(null);
        } else {
          const profileData = await loadProfile(session.user.id);
          if (mounted && profileData) {
            await updateProfile(profileData);
          } else {
            await updateProfile(null);
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        await updateProfile(null);
      } finally {
        if (mounted) {
          setLoading(false);
          setInitialized(true);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === 'SIGNED_OUT') {
        localStorage.removeItem('userProfile');
        await updateProfile(null);
        return;
      }

      if (session?.user?.id) {
        const profileData = await loadProfile(session.user.id);
        if (profileData) {
          await updateProfile(profileData);
        } else {
          await updateProfile(null);
        }
      } else {
        await updateProfile(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  if (!initialized) {
    return null;
  }

  const contextValue = {
    isAdmin: profile?.role === 'admin',
    isSales: profile?.role === 'sales',
    isCustomer: profile?.role === 'customer',
    loading,
    profile,
    isAuthenticated,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
