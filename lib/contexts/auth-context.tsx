"use client"
import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { User, PostgrestError, UserMetadata } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

// Extend the Supabase user type:
interface ExtendedUser extends User {
  user_metadata: UserMetadata
}

type Role = 'admin' | 'sales' | 'customer'

interface AuthContextType {
  user: ExtendedUser | null
  role: Role | null
  isLoading: boolean
  isAdmin: boolean
  isSales: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  isLoading: true,
  isAdmin: false,
  isSales: false
})

interface Profile {
  id: string;
  role: Role;
  // add other profile fields as needed
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null)
  const [role, setRole] = useState<Role | null>(null)
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter()
  const supabase = createClientComponentClient<Database>()

  const fetchProfile = useCallback(async (userId: string) => {
    if (!userId) {
      console.info('No userId provided, skipping profile fetch');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      // First verify auth state
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.info('No active session, skipping profile fetch');
        return null;
      }

      console.debug('Fetching profile for userId:', userId);

      const { data: profile, error: pgError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (pgError) {
        // Enhanced error context with auth state
        const errorContext = {
          userId,
          code: pgError.code,
          message: pgError.message,
          details: pgError.details,
          hint: pgError.hint,
          requestTime: new Date().toISOString(),
          path: window.location.pathname,
          hasSession: !!session,
          // Policy-related info
          statusCode: pgError.code === 'PGRST116' ? 404 :
            pgError.code === 'PGRST106' ? 403 : 500
        };

        // Policy-specific error handling
        switch (pgError.code) {
          case 'PGRST116':
            console.info('Profile not found - will create:', { userId });
            return null;
          case 'PGRST106':
            console.warn('Policy check failed:', errorContext);
            return null;
          case '42501': // Postgres permission denied
            console.warn('Database permission denied:', errorContext);
            return null;
          default:
            console.error('Profile fetch error:', errorContext);
        }

        // Only set error state on non-public pages
        if (window.location.pathname !== '/' && window.location.pathname !== '/auth/login') {
          setError('Unable to access profile data');
        }
        return null;
      }

      return profile;
    } catch (error) {
      const errorContext = {
        type: error instanceof Error ? error.constructor.name : typeof error,
        message: error instanceof Error ? error.message : 'Unknown error',
        userId,
        path: window.location.pathname,
        timestamp: new Date().toISOString()
      };

      console.error('Unexpected profile fetch error:', errorContext);

      if (window.location.pathname !== '/' && window.location.pathname !== '/auth/login') {
        setError('An unexpected error occurred');
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  const handleUserSession = async (session: any) => {
    if (!session?.user) {
      setUser(null)
      setRole(null)
      return
    }

    const profile = await fetchProfile(session.user.id)

    // Set role from profile or default to customer
    const userRole = profile?.role || 'customer'

    // Update user metadata with role
    await supabase.auth.updateUser({
      data: { role: userRole }
    })

    // If no profile exists, create one
    if (!profile) {
      await supabase
        .from('profiles')
        .upsert({
          id: session.user.id,
          role: userRole,
          updated_at: new Date().toISOString()
        })
    }

    setUser(session.user)
    setRole(userRole)

    // Handle redirections
    if (userRole === 'admin') {
      router.push('/dashboard')
    } else {
      router.push('/')
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleUserSession(session)
      setIsLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        await handleUserSession(session)
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setRole(null)
        router.push('/auth/login')
      }
      setIsLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [supabase, router])

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isLoading,
        isAdmin: role === 'admin',
        isSales: role === 'sales'
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  return useContext(AuthContext)
}
