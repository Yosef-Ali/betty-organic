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
  error: string | null
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  isLoading: true,
  isAdmin: false,
  isSales: false,
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

  const handleUserSession = useCallback(async (session: Session | null) => {
    if (session?.user) {
      setUser(session.user as ExtendedUser)
      await fetchProfile(session.user.id)
    } else {
      setUser(null)
      setRole(null)
    }
    setIsLoading(false)
  }, [fetchProfile])

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleUserSession(session)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null)
        setRole(null)
        router.push('/auth/signin')
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        await handleUserSession(session)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, handleUserSession, router])

  const value = {
    user,
    role,
    isLoading,
    isAdmin: role === 'admin',
    isSales: role === 'sales',
    error
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  return useContext(AuthContext)
}
