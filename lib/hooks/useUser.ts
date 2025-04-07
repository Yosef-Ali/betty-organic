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
        get: (name) => {
          const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
          return match?.[2];
        },
        set: (name, value, options) => {
          let cookie = `${name}=${value}`;
          if (options) {
            if (options.path) cookie += `; path=${options.path}`;
            if (options.domain) cookie += `; domain=${options.domain}`;
            if (options.maxAge) cookie += `; max-age=${options.maxAge}`;
            if (options.sameSite) {
              if (typeof options.sameSite === 'string') {
                cookie += `; samesite=${options.sameSite}`;
              } else if (options.sameSite === true) {
                cookie += `; samesite=strict`;
              }
            }
            if (options.secure) cookie += `; secure`;
          }
          document.cookie = cookie;
        },
        remove: (name, options) => {
          let cookie = `${name}=; max-age=0`;
          if (options) {
            if (options.path) cookie += `; path=${options.path}`;
            if (options.domain) cookie += `; domain=${options.domain}`;
          }
          document.cookie = cookie;
        },
      },
    }
  );

  useEffect(() => {
    let mounted = true;

    const loadUserData = async () => {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();
        if (userError) throw userError;

        if (!user) {
          if (mounted) {
            setUser(null);
            setRole(null);
            setLoading(false);
          }
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role, avatar_url')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;

        if (mounted) {
          setUser({
            ...user,
            user_metadata: {
              ...user.user_metadata,
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
