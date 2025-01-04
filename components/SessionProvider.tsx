'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { createContext, useContext, useEffect, useState } from 'react'

type SessionContextType = {
  session: any
  isLoading: boolean
}

const SessionContext = createContext<SessionContextType>({
  session: null,
  isLoading: true
})

export const SessionProvider = ({ children }: { children: React.ReactNode }) => {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const [session, setSession] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setSession(session)
      } catch (error) {
        console.error('Error getting session:', error)
      } finally {
        setIsLoading(false)
      }
    }

    getSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session)
      if (event === 'SIGNED_OUT') {
        router.push('/auth/signin')
      }
    })

    return () => subscription.unsubscribe()
  }, [router, supabase])

  return (
    <SessionContext.Provider value={{ session, isLoading }}>
      {children}
    </SessionContext.Provider>
  )
}

export const useSession = () => useContext(SessionContext)
