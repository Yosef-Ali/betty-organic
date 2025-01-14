'use server'

import { LoginFormType, ResetFormType } from 'lib/definitions'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

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
  options: {
    data: {
      full_name: string
    }
  }
}

export async function signup(formData: FormData): Promise<AuthResponse> {
  const supabase = await createClient()

  try {
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const fullName = formData.get('full_name') as string

    if (!email || !password || !fullName) {
      return {
        error: 'All fields are required',
        success: false,
        data: null
      }
    }

    const { data: signupData, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
        data: {
          full_name: fullName,
          role: 'customer'
        }
      }
    })

    if (error) {
      return {
        error: error.message,
        success: false,
        data: null
      }
    }

    return {
      error: null,
      success: true,
      data: signupData,
      message: 'Please check your email to verify your account',
      redirectTo: '/auth/verify'
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
      success: false,
      data: null
    }
  }
}

export type LoginResponse = {
  role?: 'admin' | 'customer' | 'sales'
}

export async function login(formData: LoginFormType): Promise<AuthResponse<LoginResponse>> {
  const supabase = await createClient()

  try {
    const { data: { session }, error } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    })

    if (error) {
      return {
        error: error.message,
        success: false,
        data: null
      }
    }

    if (!session?.user) {
      return {
        error: 'No user session found',
        success: false,
        data: null
      }
    }

    // Set the auth cookie manually
    const cookieStore = await cookies()
    const token = cookieStore.get('sb-xmumlfgzvrliepxcjqil-auth-token')?.value

    if (token) {
      try {
        const decoded = Buffer.from(token.split('.')[1], 'base64').toString()
        const payload = JSON.parse(decoded)
        // Store session data in cookies
        cookieStore.set('sb-session', JSON.stringify(payload), {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/'
        })
      } catch (error) {
        console.error('Failed to parse auth token:', error)
      }
    }

    const { data: { user }, error: refreshError } = await supabase.auth.getUser()
    if (refreshError) {
      return {
        error: refreshError.message,
        success: false,
        data: null
      }
    }

    const role = user?.user_metadata?.role || 'customer'
    const redirectTo = role === 'admin' ? '/admin' : '/dashboard'

    // Ensure the cookie is set before redirecting
    await new Promise(resolve => setTimeout(resolve, 100))

    return {
      error: null,
      success: true,
      data: { role },
      redirectTo
    }
  } catch (error) {
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
    const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/update-password`,
    })

    if (error) {
      return {
        error: error.message,
        success: false,
        data: null
      }
    }

    return {
      error: null,
      success: true,
      data: null,
      message: 'Password reset instructions sent to your email'
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
      success: false,
      data: null
    }
  }
}

export async function signOut(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/auth/login')
}
