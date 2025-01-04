'use client'

import { signIn } from '../../lib/auth'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Icons } from '../ui/icons'

export function SignIn() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isMagicLink, setIsMagicLink] = useState(false)
  const [magicLinkSent, setMagicLinkSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMagicLinkSent(false)

    if (isMagicLink) {
      const { error: authError } = await signIn('email', { email })

      if (authError) {
        setError(authError instanceof Error ? authError.message : 'Failed to send magic link')
      } else {
        setMagicLinkSent(true)
      }
    } else {
      const { data, error: authError } = await signIn('email', { email, password })

      if (authError) {
        setError(authError instanceof Error ? authError.message : 'Authentication failed')
      } else {
        router.push('/dashboard')
      }
    }
  }

  return (
    <div className="w-full max-w-sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        {!isMagicLink && (
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        )}
        {error && <p className="text-sm text-red-500">{error}</p>}
        {magicLinkSent && (
          <p className="text-sm text-green-500">
            Magic link sent! Check your email to sign in.
          </p>
        )}
        <div className="space-y-4">
          <Button type="submit" className="w-full">
            {isMagicLink ? 'Send Magic Link' : 'Sign In'}
          </Button>
          <Button
            variant="link"
            type="button"
            className="w-full text-sm"
            onClick={() => setIsMagicLink(!isMagicLink)}
          >
            {isMagicLink ? 'Use password instead' : 'Use magic link instead'}
          </Button>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>
          <Button
            variant="outline"
            type="button"
            className="w-full"
            onClick={() => signIn('google')}
          >
            <Icons.google className="mr-2 h-4 w-4" />
            Google
          </Button>
        </div>
      </form>
    </div>
  )
}
