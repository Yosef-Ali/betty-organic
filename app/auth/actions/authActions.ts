'use server'

import { LoginFormType, ResetFormType } from 'lib/definitions'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { logAuthEvent } from '@/lib/utils'

export type UserRole = 'admin' | 'sales' | 'customer'

interface AuthResponse<T = unknown> {
  error: string | null
  success: boolean
  data: T | null
  message?: string
  redirectTo?: string
}

interface SignupData {
  email: string
  password: string
  full_name: string
}

export async function signup(formData: FormData): Promise<AuthResponse> {
  const supabase = await createClient()

  try {
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const fullName = formData.get('full_name') as string

    // Validate input
    if (!email || !password || !fullName) {
      logAuthEvent('signup_validation_error', { email })
      return {
        error: 'All fields are required',
        success: false,
        data: null
      }
    }

    // Check if user exists
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      logAuthEvent('signup_existing_user', { email })
      return {
        error: 'User already exists',
        success: false,
        data: null
      }
    }

    // Create user
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
        data: {
          full_name: fullName,
          role: 'customer',
          status: 'active'
        }
      }
    })

    if (signupError) {
      logAuthEvent('signup_error', { error: signupError.message, email })
      return {
        error: signupError.message,
        success: false,
        data: null
      }
    }

    logAuthEvent('signup_success', { userId: signupData.user?.id })
    return {
      error: null,
      success: true,
      data: signupData,
      message: 'Please check your email to verify your account',
      redirectTo: '/auth/verify'
    }
  } catch (error) {
    logAuthEvent('signup_unexpected_error', {
      error: error instanceof Error ? error.message : 'Unknown error'
    })
    return {
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
      success: false,
      data: null
    }
  }
}

export interface LoginResponse {
  role: UserRole
  userId: string
}

export async function login(formData: LoginFormType): Promise<AuthResponse<LoginResponse>> {
  const supabase = await createClient()

  try {
    // Validate input
    if (!formData.email || !formData.password) {
      logAuthEvent('login_validation_error', { email: formData.email })
      return {
        error: 'Email and password are required',
        success: false,
        data: null
      }
    }

    // Attempt login
    const { data: { session, user }, error: loginError } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    })

    if (loginError || !session?.user) {
      logAuthEvent('login_error', {
        error: loginError?.message,
        email: formData.email
      })
      return {
        error: loginError?.message ?? 'Invalid credentials',
        success: false,
        data: null
      }
    }

    // Check email verification
    if (!user?.email_confirmed_at) {
      logAuthEvent('login_unverified_email', { userId: user.id })
      return {
        error: 'Please verify your email address before logging in',
        success: false,
        data: null,
        redirectTo: '/auth/verify'
      }
    }

    // Get profile data
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, status')
      .eq('id', session.user.id)
      .single()

    if (profileError || !profile) {
      logAuthEvent('login_profile_error', {
        error: profileError?.message,
        userId: session.user.id
      })
      return {
        error: profileError?.message ?? 'Profile not found',
        success: false,
        data: null
      }
    }

    // Check if account is active
    if (profile.status === 'inactive') {
      logAuthEvent('login_inactive_account', { userId: session.user.id })
      return {
        error: 'Your account is inactive. Please contact support.',
        success: false,
        data: null
      }
    }

    logAuthEvent('login_success', {
      userId: session.user.id,
      role: profile.role
    })

    return {
      error: null,
      success: true,
      data: {
        role: profile.role as UserRole,
        userId: session.user.id
      },
      redirectTo: getRoleBasedRedirect(profile.role as UserRole)
    }
  } catch (error) {
    logAuthEvent('login_unexpected_error', {
      error: error instanceof Error ? error.message : 'Unknown error'
    })
    return {
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
      success: false,
      data: null
    }
  }
}

export async function resetPassword(formData: ResetFormType): Promise<AuthResponse> {
  const supabase = await createClient()

  try {
    if (!formData.email) {
      return {
        error: 'Email is required',
        success: false,
        data: null
      }
    }

    const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/update-password`,
    })

    if (error) {
      logAuthEvent('reset_password_error', {
        error: error.message,
        email: formData.email
      })
      return {
        error: error.message,
        success: false,
        data: null
      }
    }

    logAuthEvent('reset_password_success', { email: formData.email })
    return {
      error: null,
      success: true,
      data: null,
      message: 'Password reset instructions sent to your email'
    }
  } catch (error) {
    logAuthEvent('reset_password_unexpected_error', {
      error: error instanceof Error ? error.message : 'Unknown error'
    })
    return {
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
      success: false,
      data: null
    }
  }
}

export async function signOut(): Promise<void> {
  const supabase = await createClient()
  try {
    // Clear local storage first to ensure user data is removed
    if (typeof window !== 'undefined') {
      localStorage.removeItem('userProfile');
    }

    const { error } = await supabase.auth.signOut()
    if (error) {
      logAuthEvent('signout_error', { error: error.message })
      throw error
    }
    logAuthEvent('signout_success')
  } catch (error) {
    logAuthEvent('signout_unexpected_error', {
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
  redirect('/auth/login')
}

function getRoleBasedRedirect(role: UserRole): string {
  return '/dashboard';
}
