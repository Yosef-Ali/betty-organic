'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export default function AuthCallbackPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const handleAuth = async () => {
      try {
        // Get the session from the OAuth callback
        const { data: { session }, error } = await supabase.auth.getSession()

        // Handle both OAuth and magic link callbacks
        // Handle both URL hash and query parameters
        const params = new URLSearchParams(
          window.location.hash.substring(1) || window.location.search.substring(1)
        )

        if (params.get('type') === 'magiclink') {
          // Get email from sessionStorage if not in params
          const email = params.get('email') || sessionStorage.getItem('magicLinkEmail') || ''

          const { error } = await supabase.auth.verifyOtp({
            type: 'magiclink',
            token_hash: params.get('token_hash') || '',
            email
          })

          if (error) throw error

          // Clear stored email
          sessionStorage.removeItem('magicLinkEmail')
        } else if (params.get('access_token')) {
          // Handle OAuth authentication
          await supabase.auth.setSession({
            access_token: params.get('access_token') || '',
            refresh_token: params.get('refresh_token') || ''
          })
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

        try {
          // Set timeout for the authentication process
          const timeout = setTimeout(() => {
            throw new Error('Authentication timed out')
          }, 10000) // 10 seconds timeout

          // Wait for cookies to be set
          await new Promise(resolve => setTimeout(resolve, 500))

          // Get the redirect URL from session storage or default to homepage
          const returnTo = sessionStorage.getItem('returnTo') || '/'
          sessionStorage.removeItem('returnTo')

          // Verify authentication status
          const supabase = createClientComponentClient()
          const { data: { session: authSession }, error: sessionError } = await supabase.auth.getSession()

          if (sessionError) {
            throw new Error(`Session error: ${sessionError.message}`)
          }

          if (!authSession) {
            throw new Error('No session found')
          }

          // Get user role from session
          const userRole = authSession.user?.user_metadata?.role || 'customer'
          const redirectPath = userRole === 'admin' ? '/admin' : '/'

          // Perform the redirect
          await router.push(redirectPath)

          clearTimeout(timeout)
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Authentication failed'
          console.error('Authentication error:', errorMessage)
          // Redirect to error page with specific error message
          await router.push(`/auth/error?message=${encodeURIComponent(errorMessage)}`)
        }
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
