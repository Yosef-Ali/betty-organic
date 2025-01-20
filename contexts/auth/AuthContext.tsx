'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

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
    // Try to load from localStorage on initial mount
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('userProfile');
      return saved ? JSON.parse(saved) : null;
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
        console.error('Profile fetch error:', error);
        localStorage.removeItem('userProfile');
        return null;
      }

      if (profileData) {
        // Always save to localStorage when we get new data
        localStorage.setItem('userProfile', JSON.stringify(profileData));
        return profileData;
      }
      return null;
    } catch (error) {
      console.error('Profile load error:', error);
      localStorage.removeItem('userProfile');
      return null;
    }
  };

  // Single source of truth for updating profile
  const updateProfile = (newProfile: Profile | null) => {
    if (newProfile) {
      localStorage.setItem('userProfile', JSON.stringify(newProfile));
    } else {
      localStorage.removeItem('userProfile');
    }
    setProfile(newProfile);
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user?.id) {
          updateProfile(null);
        } else {
          const profileData = await loadProfile(session.user.id);
          if (mounted && profileData) {
            updateProfile({
              ...profileData,
              email: session.user.email ?? '',
              role: profileData.role,
              status: profileData.status || 'active'
            });
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        updateProfile(null);
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
        if (!mounted) return;

        if (session?.user?.id) {
          const profileData = await loadProfile(session.user.id);
          if (profileData) {
            updateProfile({
              ...profileData,
              email: session.user.email ?? '',
              role: profileData.role,
              status: profileData.status || 'active'
            });
          }
        } else {
          updateProfile(null);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  // Don't render until we've completed initial load
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
