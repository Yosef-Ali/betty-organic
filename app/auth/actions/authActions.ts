'use server';

import { createClient } from '@/lib/supabase/server';
import type { RedirectType } from 'next/navigation';

export type AuthResponse<T = unknown> = {
  error?: string;
  success: boolean;
  data?: T | null;
  message?: string;
  redirect?: {
    destination: string;
    type?: RedirectType;
  };
};

export async function signInWithGoogle(): Promise<AuthResponse> {
  const supabase = await createClient();

  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    });

    if (error) {
      return {
        error: error.message,
        success: false,
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error('Google sign in error:', error);
    return {
      error: 'An unexpected error occurred',
      success: false,
    };
  }
}

export async function signIn(formData: FormData): Promise<AuthResponse> {
  const supabase = await createClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  try {
    const {
      data: { session },
      error: signInError,
    } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      return {
        error: signInError.message,
        success: false,
      };
    }

    if (!session) {
      return {
        error: 'Authentication failed',
        success: false,
      };
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, status')
      .eq('id', session.user.id)
      .single();

    if (profileError) {
      return {
        error: profileError.message,
        success: false,
      };
    }

    if (profile.status === 'inactive') {
      return {
        error: 'Account is inactive',
        success: false,
      };
    }

    // Return redirect based on role
    const destination = '/';

    return {
      success: true,
      redirect: {
        destination,
        type: 'push',
      },
    };
  } catch (error) {
    console.error('Sign in error:', error);
    return {
      error: 'An unexpected error occurred',
      success: false,
    };
  }
}

export async function signUp(formData: FormData): Promise<AuthResponse> {
  const supabase = await createClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const fullName = formData.get('full_name') as string;

  try {
    // Check if user exists
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return {
        error: 'User already exists',
        success: false,
      };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
        data: {
          full_name: fullName,
          role: 'customer',
          status: 'active',
        },
      },
    });

    if (error) {
      return {
        error: error.message,
        success: false,
      };
    }

    return {
      success: true,
      message: 'Please check your email to confirm your account',
    };
  } catch (error) {
    console.error('Sign up error:', error);
    return {
      error: 'An unexpected error occurred',
      success: false,
    };
  }
}

export async function signOut(): Promise<AuthResponse> {
  const supabase = await createClient();

  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    return {
      success: true,
      redirect: {
        destination: '/auth/login',
        type: 'replace',
      },
    };
  } catch (error) {
    console.error('Sign out error:', error);
    return {
      error: 'Error signing out',
      success: false,
      redirect: {
        destination: '/auth/auth-error',
        type: 'push',
      },
    };
  }
}

export async function resetPassword(formData: FormData): Promise<AuthResponse> {
  const supabase = await createClient();
  const email = formData.get('email') as string;

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/update-password`,
    });

    if (error) {
      return {
        error: error.message,
        success: false,
      };
    }

    return {
      success: true,
      message: 'Password reset instructions sent to your email',
    };
  } catch (error) {
    console.error('Reset password error:', error);
    return {
      error: 'An unexpected error occurred',
      success: false,
    };
  }
}

export async function updatePassword(
  formData: FormData,
): Promise<AuthResponse> {
  const supabase = await createClient();
  const password = formData.get('password') as string;

  try {
    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      return {
        error: error.message,
        success: false,
      };
    }

    return {
      success: true,
      redirect: {
        destination: '/auth/login?message=Password updated successfully',
        type: 'replace',
      },
    };
  } catch (error) {
    console.error('Update password error:', error);
    return {
      error: 'An unexpected error occurred',
      success: false,
    };
  }
}
