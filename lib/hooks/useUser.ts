import { createBrowserClient } from '@supabase/ssr';
import { useEffect, useState } from 'react';
import type { User } from '@/types/user';

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`))?.[2];
        },
      },
    },
  );

  useEffect(() => {
    let mounted = true;

    const loadUserData = async () => {
      try {
        // Get session
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (!session?.user) {
          if (mounted) {
            setUser(null);
            setRole(null);
            setLoading(false);
          }
          return;
        }

        // Get profile data
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role, avatar_url')
          .eq('id', session.user.id)
          .single();

        if (profileError) throw profileError;

        if (mounted) {
          setUser({
            ...session.user,
            user_metadata: {
              ...session.user.user_metadata,
              role: profile?.role,
              avatar_url: profile?.avatar_url,
            },
          });
          setRole(profile?.role);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadUserData();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadUserData();
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  return {
    user,
    loading,
    isAdmin: role === 'admin',
    isSales: role === 'sales',
    isCustomer: role === 'customer',
  };
}
