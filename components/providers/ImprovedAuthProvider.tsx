'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { Profile } from '@/lib/types/auth';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';

type AuthContextType = {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  error: Error | null;
  refreshProfile: () => Promise<Profile | null>;
  supabase: any;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  isLoading: true,
  error: null,
  refreshProfile: async () => null,
  supabase: null,
});

interface ImprovedAuthProviderProps {
  user: User | null; // Server-side user data
  profile: Profile | null; // Server-side profile data
  children: React.ReactNode;
}

export function ImprovedAuthProvider({ 
  user: serverUser, 
  profile: serverProfile, 
  children 
}: ImprovedAuthProviderProps) {
  const [isHydrated, setIsHydrated] = useState(false);
  
  // Use the Supabase auth hook for client-side session management
  const { 
    user: clientUser, 
    profile: clientProfile, 
    isLoading: clientLoading, 
    error: clientError,
    refreshProfile,
    supabase
  } = useSupabaseAuth();

  // Handle hydration
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Use server data during SSR/initial render, then switch to client data
  // BUT: if client data is null and server data exists, prefer server data
  const user = isHydrated ? (clientUser || serverUser) : serverUser;
  const profile = isHydrated ? (clientProfile || serverProfile) : serverProfile;
  const isLoading = isHydrated ? clientLoading : false;
  const error = isHydrated ? clientError : null;

  // Only log in development and avoid excessive logging
  if (process.env.NODE_ENV === 'development' && !isHydrated) {
    console.log('🔐 [ImprovedAuth] Initializing:', {
      serverUser: !!serverUser,
      serverProfile: !!serverProfile,
      serverProfileRole: serverProfile?.role,
    });
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        error,
        refreshProfile,
        supabase,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an ImprovedAuthProvider');
  }
  return context;
};