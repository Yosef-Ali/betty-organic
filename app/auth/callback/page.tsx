'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function AuthCallbackPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const handleAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting session:', error)
          router.push('/auth/signin?error=authentication_failed')
          return
        }

        if (!session) {
          console.error('No session found')
          router.push('/auth/signin?error=no_session')
          return
        }

        // Successful authentication
        router.push('/dashboard')
      } catch (err) {
        console.error('Auth callback error:', err)
        router.push('/auth/signin?error=unexpected_error')
      }
    }

    handleAuth()
  }, [router, supabase])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
    </div>
  )
}
