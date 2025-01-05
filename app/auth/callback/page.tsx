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
        // Get the session from the OAuth callback
        const { data: { session }, error } = await supabase.auth.getSession()
        
        // Handle both OAuth and magic link callbacks
        if (window.location.hash) {
          const hash = window.location.hash.substring(1)
          const params = new URLSearchParams(hash)
          
          if (params.get('type') === 'magiclink') {
            // Handle magic link authentication
            const { error } = await supabase.auth.verifyOtp({
              type: 'magiclink',
              token_hash: params.get('token_hash') || '',
              email: params.get('email') || ''
            })
            
            if (error) throw error
          } else {
            // Handle OAuth authentication
            await supabase.auth.setSession({
              access_token: params.get('access_token') || '',
              refresh_token: params.get('refresh_token') || ''
            })
          }
        }
        
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
