'use client'

import { useState } from 'react'
import { LoginForm } from './login-form'
import { SignUpForm } from './signup-form'
import { Button } from './ui/button'

type AuthFormType = 'login' | 'signup' | 'reset'

export function AuthForms() {
  const [formType, setFormType] = useState<AuthFormType>('login')

  return (
    <div className="w-full max-w-xs space-y-6">
      {formType === 'login' && (
        <>
          <LoginForm />
          <div className="text-center">
            <Button
              variant="link"
              className="text-sm text-muted-foreground"
              onClick={() => setFormType('signup')}
            >
              Don't have an account? Sign up
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
      {formType === 'reset' && (
        // TODO: Implement password reset form
        <div>Password Reset Form (Not implemented)</div>
      )}
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
  )
}
