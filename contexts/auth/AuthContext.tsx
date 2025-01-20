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
}

const AuthContext = createContext<AuthContextType>({
  isAdmin: false,
  isSales: false,
  isCustomer: false,
  loading: true,
  profile: null
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedProfile = localStorage.getItem('userProfile');
        return savedProfile ? JSON.parse(savedProfile) : null;
      } catch (error) {
        logAuthEvent('Error loading saved profile', {
          error: error instanceof Error ? error.message : 'Unknown error',
          level: 'error'
        });
        return null;
      }
    }
    return null;
  });

  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const supabase = createClientComponentClient();

  const loadProfile = async (userId: string) => {
    try {
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        logAuthEvent('Profile fetch error', {
          error: error.message,
          user: userId,
          level: 'error'
        });
        localStorage.removeItem('userProfile');
        return null;
      }

      if (!profileData) {
        logAuthEvent('No profile found', {
          user: userId,
          level: 'warn'
        });
        return null;
      }

      const profile: Profile = {
        ...profileData,
        role: profileData.role || 'customer',
        status: profileData.status || 'active'
      };

      localStorage.setItem('userProfile', JSON.stringify(profile));
      return profile;
    } catch (error) {
      logAuthEvent('Profile load error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        user: userId,
        level: 'error'
      });
      localStorage.removeItem('userProfile');
      return null;
    }
  };

  const updateProfile = async (newProfile: Profile | null) => {
    try {
      if (newProfile) {
        localStorage.setItem('userProfile', JSON.stringify(newProfile));
        logAuthEvent('Profile updated', {
          user: newProfile.id,
          level: 'info'
        });
      } else {
        localStorage.removeItem('userProfile');
        logAuthEvent('Profile cleared', { level: 'info' });
      }
      setProfile(newProfile);
    } catch (error) {
      logAuthEvent('Error updating profile', {
        error: error instanceof Error ? error.message : 'Unknown error',
        level: 'error'
      });
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        setLoading(true);
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          logAuthEvent('Session fetch error', {
            error: error.message,
            level: 'error'
          });
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
        logAuthEvent('Auth initialization error', {
          error: error instanceof Error ? error.message : 'Unknown error',
          level: 'error'
        });
        await updateProfile(null);
      } finally {
        if (mounted) {
          setLoading(false);
          setInitialized(true);
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        logAuthEvent('Auth state changed', {
          event,
          user: session?.user?.id,
          level: 'info'
        });

        if (!mounted) return;

        try {
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
        } catch (error) {
          logAuthEvent('Auth state change error', {
            error: error instanceof Error ? error.message : 'Unknown error',
            level: 'error'
          });
          await updateProfile(null);
        }
      }
    );

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
    profile
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
