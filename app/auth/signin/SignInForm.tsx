'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { useAuthForm } from '@/lib/hooks/useAuthForm'

interface SignInFormProps {
  error?: string;
  showMagicLink?: boolean;
}

export default function SignInForm({ error: initialError, showMagicLink = true }: SignInFormProps) {
  const { error: authError, signIn } = useAuthForm()
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(initialError || null)
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const supabase = createClientComponentClient()

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setLoading(true)
      setError(null)

      const { error } = await signIn(email, password)
      if (!error) {
        // Check if user is admin
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', (await supabase.auth.getUser()).data.user?.id)
          .single()

        if (profile?.role === 'admin') {
          window.location.href = '/dashboard'
        } else {
          setError('Unauthorized access')
        }
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Sign in failed')
    } finally {
      setLoading(false)
    }
  }

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

  const handleMagicLinkLogin = async () => {
    if (!validateEmail(email)) {
      setError('Please enter a valid email address')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          shouldCreateUser: true
        }
      })

      if (error) {
        if (error.message.includes('email rate limit exceeded')) {
          throw new Error('Too many attempts. Please try again later.')
        }
        throw error
      }

      setMagicLinkSent(true)
      sessionStorage.setItem('magicLinkEmail', email)
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An error occurred'
      console.error('Magic link error:', errorMessage)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true)
      setError(null)

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
    <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm">
      <CardHeader>
        <CardTitle>Sign In</CardTitle>
        <CardDescription>
          Sign in to your account to continue
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {showMagicLink && (
          <>
            {magicLinkSent ? (
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  We&apos;ve sent a magic link to <span className="font-medium">{email}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  Check your inbox and click the link to sign in.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
                <Button
                  onClick={handleMagicLinkLogin}
                  disabled={loading || !email}
                  className="w-full"
                >
                  {loading ? 'Sending...' : 'Send Magic Link'}
                </Button>
              </div>
            )}
          </>
        )}

        <Button
          variant="outline"
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full"
        >
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
