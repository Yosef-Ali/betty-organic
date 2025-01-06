'use client'

import { useState } from 'react'

import { SignUpForm } from './signup-form'
import { Button } from '@/components/ui/button'
import { LoginForm } from './login-form'
import { ResetForm } from './reset-form'

type AuthFormType = 'login' | 'signup' | 'reset'

export function AuthForms() {
  const [formType, setFormType] = useState<AuthFormType>('login')

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-xs space-y-6 py-12">
        {formType === 'login' && (
          <>
            <LoginForm />
            <div className="text-center">
              <Button
                variant="link"
                className="text-sm text-muted-foreground"
                onClick={() => setFormType('signup')}
              >
                Don&apos;t have an account? Sign up
              </Button>
            </div>
          </>
        )}
        {formType === 'signup' && (
          <>
            <SignUpForm />
            <div className="text-center">
              <Button
                variant="link"
                className="text-sm text-muted-foreground"
                onClick={() => setFormType('login')}
              >
                Already have an account? Log in
              </Button>
            </div>
          </>
        )}
        {formType === 'reset' && <ResetForm />}
        {formType !== 'reset' && (
          <div className="text-center">
            <Button
              variant="link"
              className="text-sm text-muted-foreground"
              onClick={() => setFormType('reset')}
            >
              Forgot password?
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
