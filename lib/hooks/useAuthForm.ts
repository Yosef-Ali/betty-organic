import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { AuthError } from '@supabase/supabase-js'

export function useAuthForm() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClientComponentClient()

  const handleAuthError = (error: AuthError) => {
    const errorMessage = error.message === 'Invalid login credentials'
      ? 'Invalid email or password'
      : error.message
    setError(errorMessage)
  }

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)
      setError(null)
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      return { error: null }
    } catch (error) {
      handleAuthError(error as AuthError)
      return { error }
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string, name?: string) => {
    try {
      setLoading(true)
      setError(null)
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            full_name: name
          }
        }
      })
      if (error) throw error
    } catch (error) {
      handleAuthError(error as AuthError)
    } finally {
      setLoading(false)
    }
  }

  return { loading, error, signIn, signUp }
}
