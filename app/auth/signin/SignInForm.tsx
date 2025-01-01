'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useState } from 'react'

interface SignInFormProps {
  error?: string;
}

export default function SignInForm({ error: initialError }: SignInFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(initialError || null)
  const supabase = createClientComponentClient()

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true)
      setError(null)

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${location.origin}/auth/callback`
        }
      })

      if (error) throw error
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md space-y-4 p-4">
      <button
        onClick={handleGoogleSignIn}
        disabled={loading}
        className="w-full rounded bg-white border p-2 hover:bg-gray-50 disabled:opacity-50"
      >
        {loading ? 'Loading...' : 'Sign in with Google'}
      </button>

      {error && (
        <div className="text-red-600 bg-red-100 p-2 rounded">{error}</div>
      )}
    </div>
  )
}
