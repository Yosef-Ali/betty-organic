'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

type Profile = {
  id: string;
  role: 'admin' | 'sales' | 'customer';
  name: string | null;
  email: string;
  status: string | null;
  auth_provider: string | null;
  created_at: string | null;
  updated_at: string;
  avatar_url?: string | null;
  address?: string | null;
};

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

  useEffect(() => {
    const supabase = createClient();

    // Set up auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setIsLoading(true);
      try {
        if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
          if (session?.user) {
            setUser(session.user);
            // Fetch user profile
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (profileError) throw profileError;
            setProfile(profileData);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
          router.push('/auth/login');
        }
      } catch (err) {
        console.error('Auth state change error:', err);
        setError(err instanceof Error ? err : new Error('Authentication error'));
      } finally {
        setIsLoading(false);
      }
    });

    // Check for initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Get session error:', error);
        setError(error);
      } else if (session?.user) {
        setUser(session.user);
        // Fetch user profile
        supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
          .then(({ data: profileData, error: profileError }) => {
            if (profileError) {
              console.error('Profile fetch error:', profileError);
              setError(profileError);
            } else {
              setProfile(profileData);
            }
          });
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

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
        setError
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
