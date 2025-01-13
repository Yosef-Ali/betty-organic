'use client'

import { createClientComponentClient, Session } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

interface SessionProviderProps {
  initialSession: Session | null
  children: React.ReactNode
}

type SessionContextType = {
  session: Session | null
  isLoading: boolean
}

const SessionContext = createContext<SessionContextType>({
  session: null,
  isLoading: true
})

export const SessionProvider = ({ initialSession, children }: SessionProviderProps) => {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const [session, setSession] = useState<Session | null>(initialSession)
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

      switch (event) {
        case 'SIGNED_OUT':
          // Clear all auth-related storage
          sessionStorage.removeItem('returnTo')
          sessionStorage.removeItem('magicLinkEmail')
          router.push('/auth/login')
          break

        case 'SIGNED_IN':
        case 'TOKEN_REFRESHED':
          // Handle both regular sign-in and magic link sign-in
          const returnTo = sessionStorage.getItem('returnTo') || '/dashboard'
          sessionStorage.removeItem('returnTo')
          router.push(returnTo)
          break

        case 'PASSWORD_RECOVERY':
          // Handle password recovery if needed
          router.push('/auth/reset-password')
          break
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
