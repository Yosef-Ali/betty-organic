"use client"
import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { User, PostgrestError, UserMetadata, Session } from '@supabase/supabase-js'
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
  isCustomer: boolean
  error: string | null
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  isLoading: true,
  isAdmin: false,
  isSales: false,
  isCustomer: false,
  error: null
})

interface Profile {
  id: string;
  role: Role;
  // add other profile fields as needed
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<ExtendedUser | null>(null)
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

    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (profileError) throw profileError

      if (profile) {
        setRole(profile.role as Role)
        return profile
      }
      return null
    } catch (error) {
      console.error('Error fetching profile:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch profile')
      return null
    }
  }, [supabase])

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) throw sessionError

        if (session?.user) {
          setUser(session.user as ExtendedUser)
          const profile = await fetchProfile(session.user.id)
          if (!profile) {
            console.warn('No profile found for user')
          }
        } else {
          setUser(null)
          setRole(null)
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        setError(error instanceof Error ? error.message : 'Authentication failed')
        setUser(null)
        setRole(null)
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user as ExtendedUser)
          await fetchProfile(session.user.id)
        } else {
          setUser(null)
          setRole(null)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, fetchProfile])

  const value = {
    user,
    role,
    isLoading,
    isAdmin: role === 'admin',
    isSales: role === 'sales',
    isCustomer: role === 'customer',
    error
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  return useContext(AuthContext)
}
