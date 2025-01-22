'use client';

import {
  createContext,
  useContext,
  useDebugValue,
  useEffect,
  useState,
} from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

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

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isAdmin: boolean;
  isSales: boolean;
  isCustomer: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  isLoading: true,
  isAdmin: false,
  isSales: false,
  isCustomer: false,
  error: null,
});

// Create singleton supabase client
const supabase = createClient();

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const getUser = async () => {
      try {
        setError(null); // Reset error state
        // Get initial session
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (mounted) {
          setUser(session?.user ?? null);

          if (session?.user) {
            // Get user profile
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (profileError) throw profileError;
            if (mounted) setProfile(profile);
          }
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Error loading user';
        console.error('Auth error:', error);
        if (mounted) setError(message);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    // Call getUser immediately
    getUser();

    // Set up auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      try {
        setError(null); // Reset error state
        setUser(session?.user ?? null);

        if (session?.user) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profileError) throw profileError;
          setProfile(profile);
        } else {
          setProfile(null);
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Error updating auth state';
        console.error('Auth state error:', error);
        setError(message);
      } finally {
        setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = {
    user,
    profile,
    isLoading,
    error,
    isAdmin: profile?.role === 'admin',
    isSales: profile?.role === 'sales',
    isCustomer: profile?.role === 'customer',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Keep both exports for backward compatibility
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  // Add debug information to React DevTools
  useDebugValue(
    {
      hasUser: !!context.user,
      hasProfile: !!context.profile,
      error: context.error,
    },
    status =>
      `Auth: ${status.hasUser ? 'Logged in' : 'Logged out'}, Profile: ${
        status.hasProfile ? 'Loaded' : 'Loading'
      }${status.error ? `, Error: ${status.error}` : ''}`,
  );

  return context;
};

export const useAuthContext = useAuth;
