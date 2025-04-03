'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { Profile } from '@/lib/types/auth'; // Import the correct Profile type definition
import { createClient } from '@/lib/supabase/client';

type AuthContextType = {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  error: Error | null;
  setUser: (user: User | null) => void;
  setProfile: (profile: Profile | null) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: Error | null) => void;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  isLoading: true,
  error: null,
  setUser: () => { },
  setProfile: () => { },
  setIsLoading: () => { },
  setError: () => { },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Initialize auth state
    const initAuth = async () => {
      try {
        // Use try/catch to silently handle any errors without console messages
        let currentUser = null;
        try {
          const response = await supabase.auth.getUser();
          currentUser = response.data?.user || null;
        } catch (authError) {
          // Silently handle error - don't log to console
        }

        if (currentUser) {
          setUser(currentUser);

          // Fetch user profile - silently handle errors
          try {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', currentUser.id)
              .single();

            // Validate profile data before setting state
            if (profileData && profileData.role && ['admin', 'sales', 'customer'].includes(profileData.role)) {
              const validatedProfile: Profile = {
                ...profileData,
                role: profileData.role as 'admin' | 'sales' | 'customer',
                phone: profileData.phone || null,
                address: profileData.address || null,
              };
              setProfile(validatedProfile);
            } else {
              if (profileData) { // Log if profile exists but role is invalid
                console.warn(`AuthProvider initAuth: Invalid role ('${profileData.role}') for user ${currentUser.id}. Setting profile to null.`);
              }
              setProfile(null); // Set profile to null if data is missing or role is invalid
            }
          } catch (profileError) {
            // Silently handle profile fetch errors
          }
        }
      } catch (err) {
        // Suppress error logging
        // Just set error state without logging to console
        setError(
          err instanceof Error ? err : new Error('Authentication error'),
        );
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Set up auth state change listener
    let subscription: { unsubscribe: () => void } | undefined;
    try {
      const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
        // Silently handle any auth state changes
        try {
          if (event === 'SIGNED_IN' && session?.user) {
            setUser(session.user);

            // Try to fetch profile
            const { data: profileData } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();

            // Validate profile data before setting state
            if (profileData && profileData.role && ['admin', 'sales', 'customer'].includes(profileData.role)) {
              const validatedProfile: Profile = {
                ...profileData,
                role: profileData.role as 'admin' | 'sales' | 'customer',
                phone: profileData.phone || null,
                address: profileData.address || null,
              };
              setProfile(validatedProfile);
            } else {
              if (profileData) { // Log if profile exists but role is invalid
                console.warn(`AuthProvider onAuthStateChange: Invalid role ('${profileData.role}') for user ${session.user.id}. Setting profile to null.`);
              }
              setProfile(null); // Set profile to null if data is missing or role is invalid
            }
          } else if (event === 'SIGNED_OUT') {
            setUser(null);
            setProfile(null);
          }
        } catch (stateError) {
          // Silently handle errors
        }
      });

      subscription = data?.subscription;
    } catch (listenerError) {
      // Silently handle listener setup errors
    }

    return () => {
      // Clean up subscription if it exists
      if (subscription) {
        try {
          subscription.unsubscribe();
        } catch (unsubError) {
          // Silently handle unsubscribe errors
        }
      }
    };
  }, [supabase, router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        error,
        setUser,
        setProfile,
        setIsLoading,
        setError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
