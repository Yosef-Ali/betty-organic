import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useEffect, useState } from 'react'
import { User as SupabaseUser } from '@supabase/supabase-js'

export interface UserMetadata {
  role: 'admin' | 'sales' | 'customer'
  avatar_url?: string
}

export type User = Omit<SupabaseUser, 'user_metadata'> & {
  user_metadata: UserMetadata
}

export function useUser() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    // Immediately check for an existing session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setUser(session?.user as User ?? null)
      } catch (error) {
        console.error('Error getting initial session:', error)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Set up the auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user as User ?? null)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  return {
    user,
    loading,
    isAdmin: true, // Temporarily set to true
    isSales: user?.user_metadata.role === 'sales',
    isCustomer: user?.user_metadata.role === 'customer',
  }
}
