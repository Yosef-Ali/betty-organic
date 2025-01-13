import { useState } from 'react'
import { AuthError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface AuthResponse {
  error: AuthError | null;
}

export function useAuthForm() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAuthError = (error: AuthError) => {
    const errorMessage = error.message === 'Invalid login credentials'
      ? 'Invalid email or password'
      : error.message
    setError(errorMessage)
  }

  const signIn = async (email: string, password: string): Promise<AuthResponse> => {
    try {
      setLoading(true)
      setError(null)
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      return { error: null }
    } catch (error) {
      const authError = error as AuthError
      handleAuthError(authError)
      return { error: authError }
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string, name?: string): Promise<AuthResponse> => {
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
      return { error: null }
    } catch (error) {
      const authError = error as AuthError
      handleAuthError(authError)
      return { error: authError }
    } finally {
      setLoading(false)
    }
  }

  return { loading, error, signIn, signUp }
}
