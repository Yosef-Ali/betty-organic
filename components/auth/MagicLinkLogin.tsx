'use client'

import { useState } from 'react'
import { signIn } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'

export function MagicLinkLogin() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleLogin = async () => {
    if (!email) {
      toast({
        title: 'Error',
        description: 'Please enter your email address',
        variant: 'destructive'
      })
      return
    }

    setLoading(true)
    try {
      const { error } = await signIn('magiclink', { email })
      if (error) {
        throw error
      }
      toast({
        title: 'Check your email',
        description: 'We\'ve sent you a magic link to sign in'
      })
    } catch (error: unknown) {
      let errorMessage = 'Failed to send magic link'
      if (error instanceof Error) {
        errorMessage = error.message
      }
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Input
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Button onClick={handleLogin} disabled={loading}>
        {loading ? 'Sending...' : 'Send Magic Link'}
      </Button>
    </div>
  )
}
