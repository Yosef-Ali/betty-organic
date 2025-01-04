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
        // Extract token from URL hash
        const hash = window.location.hash.substring(1)
        const params = new URLSearchParams(hash)
        
        // Store tokens in localStorage
        localStorage.setItem('supabase.auth.token', JSON.stringify({
          access_token: params.get('access_token'),
          refresh_token: params.get('refresh_token'),
          expires_at: params.get('expires_at')
        }))

        // Get the session
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting session:', error)
          router.push('/auth/signin?error=' + encodeURIComponent(error.message))
          return
        }

        if (!session) {
          console.error('No session found')
          router.push('/auth/signin?error=no_session')
          return
        }

        // Clear the hash from URL
        window.history.replaceState({}, document.title, window.location.pathname)

        // Redirect to dashboard or stored returnTo URL
        const returnTo = sessionStorage.getItem('returnTo') || '/dashboard'
        sessionStorage.removeItem('returnTo')
        router.push(returnTo)
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
