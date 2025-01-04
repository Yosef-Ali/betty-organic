'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"

interface SignInFormProps {
  error?: string;
}

const GoogleIcon = () => (
  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
    <path d="M1 1h22v22H1z" fill="none" />
  </svg>
)

export default function SignInForm({ error: initialError }: SignInFormProps) {
  useEffect(() => {
    // Check for OAuth error in URL
    const urlParams = new URLSearchParams(window.location.search)
    const error = urlParams.get('error_description')
    if (error) {
      setError(error)
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(initialError || null)
  const supabase = createClientComponentClient()

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Add debug logging
      console.log('Initiating Google OAuth...')
      console.log('Redirect URL:', `${location.origin}/auth/callback`)

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      })

      if (error) throw error
      
      // Handle the redirect URL from the response
      if (data?.url) {
        window.location.href = data.url
      }

      if (error) {
        console.error('Google OAuth error:', error)
        throw error
      }

      console.log('Google OAuth response:', data)
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An error occurred'
      console.error('Authentication error:', errorMessage)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }


  return (
    <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm"> {/* Increased opacity from bg-white/90 to bg-white/95 */}
      <CardHeader>
        <CardTitle>Sign In</CardTitle>
        <CardDescription>
          Sign in to your account to continue
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative mt-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>

        <Button
          variant="outline"
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full"
        >
          <GoogleIcon />
          {loading ? 'Loading...' : 'Sign in with Google'}
        </Button>
      </CardContent>
      {error && (
        <CardFooter>
          <div className="text-red-600 bg-red-100 p-2 rounded w-full text-sm">
            {error}
          </div>
        </CardFooter>
      )}
    </Card>
  )
}
