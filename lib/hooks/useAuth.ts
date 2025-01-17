import { useEffect, useState, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import type { User } from '@/types/user';

interface AuthContext {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<boolean>;
  checkSession: () => Promise<void>;
}

export function useAuth(): AuthContext {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkSession = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setIsAuthenticated(!!session?.user);
      setError(null);
    } catch (error) {
      console.error('Error checking session:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to check authentication status'
      );
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) throw error;
      await checkSession();
      router.refresh();
    } catch (error) {
      console.error('Login error:', error);
      setError(
        error instanceof Error ? error.message : 'Login failed'
      );
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [supabase, checkSession, router]);

  const logout = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw new Error(error.message);
      }

      setUser(null);
      setIsAuthenticated(false);
      router.refresh();
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      setError(
        error instanceof Error ? error.message : 'Logout failed'
      );
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        setIsAuthenticated(!!session?.user);
        setError(null);

        // Refresh page on auth state changes
        if (['SIGNED_IN', 'SIGNED_OUT'].includes(event)) {
          router.refresh();
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase, checkSession, router]);

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    checkSession
  };
}
