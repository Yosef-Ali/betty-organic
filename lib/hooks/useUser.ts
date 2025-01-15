import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useEffect, useState } from 'react'

export interface UserMetadata {
  role: 'admin' | 'sales' | 'customer'
  avatar_url?: string
}

export interface User {
  id: string
  email?: string
  user_metadata: UserMetadata
}

export function useUser() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setUser(session?.user ?? null)
      } finally {
        setLoading(false)
      }
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  return {
    user,
    loading,
    isAdmin: user?.user_metadata.role === 'admin',
    isSales: user?.user_metadata.role === 'sales',
    isCustomer: user?.user_metadata.role === 'customer',
  }
}
