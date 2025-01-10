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
    setIsLoading(true);
    setError(null);
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single()

      if (error) {
        // Handle specific error cases
        switch (error.code) {
          case 'PGRST116': // 404 - profile not found
            return null;
          case 'PGRST106': // 401 - unauthorized
            console.warn('Unauthorized profile access:', {
              userId,
              code: error.code,
              message: error.message
            });
            return null;
          case 'PGRST100': // 400 - bad request
            console.error('Invalid profile request:', {
              userId,
              code: error.code,
              message: error.message,
              details: error.details
            });
            return null;
          default:
            const errorDetails = {
              userId,
              code: error?.code || 'UNKNOWN_ERROR_CODE',
              message: error?.message || 'Unknown error message',
              details: error?.details || 'No additional details',
              timestamp: new Date().toISOString(),
              error: error // Include the full error object
            };
            console.error('Profile fetch error:', errorDetails);
            setError(error?.message || 'Failed to fetch profile');
            return null;
        }
      }

      return profile
    } catch (error: any) {
      console.error('Unexpected profile fetch error:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      setError(error.message);
      return null
    }
  }, [supabase, setIsLoading, setError]);

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
