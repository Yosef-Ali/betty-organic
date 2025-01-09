'use server';

import { LoginFormType, ResetFormType } from 'lib/definitions';
import { redirect } from 'next/navigation';
import { createClient } from 'lib/supabase/server';
import { cookies } from 'next/headers';

interface AuthResponse {
  error: null | string;
  success: boolean;
  data: unknown | null;
  message?: string;  // Add optional message property
  redirectTo?: string;
}

export async function signup(formData: FormData): Promise<AuthResponse> {
  const supabase = await createClient();
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    options: {
      data: {
        full_name: formData.get('full_name') as string,
      },
    },
  };
  try {
    const { data: signupData, error } = await supabase.auth.signUp(data);

    if (error) {
      console.error('Supabase signup error:', error);
      return {
        error: error.message,
        success: false,
        data: null
      };
    }

    console.log('Signup successful:', signupData);

    // Check if email verification is required
    if (signupData?.user?.identities?.length === 0) {
      return {
        error: null,
        success: true,
        data: signupData,
        message: 'Please check your email to verify your account.'
      };
    }

    return {
      error: null,
      success: true,
      data: signupData
    };
  } catch (error) {
    console.error('Unexpected signup error:', error);
    return {
      error: 'An unexpected error occurred',
      success: false,
      data: null
    };
  }
}

export async function login(formData: LoginFormType): Promise<AuthResponse> {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    });

    if (error) {
      console.error('Login error:', error);
      return {
        error: error.message,
        success: false,
        data: null
      };
    }

    if (!data.session?.user?.email_confirmed_at) {
      return {
        error: 'Please verify your email before logging in.',
        success: false,
        data: null,
      };
    }

    console.log('Login successful:', data);
    return {
      error: null,
      success: true,
      data,
      redirectTo: '/',
    };
  } catch (error) {
    console.error('Unexpected login error:', error);
    return {
      error: `An unexpected error occurred: ${error}`,
      success: false,
      data: null
    };
  }
}

export async function resetPassword(formData: ResetFormType): Promise<AuthResponse> {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase.auth.resetPasswordForEmail(formData.email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?returnTo=/auth/login`,
    });

    if (error) {
      console.error('Password reset error:', error);
      return {
        error: error.message,
        success: false,
        data: null
      };
    }

    console.log('Password reset email sent successfully');
    return {
      error: null,
      success: true,
      data
    };
  } catch (error) {
    console.error('Unexpected password reset error:', error);
    return {
      error: 'An unexpected error occurred',
      success: false,
      data: null
    };
  }
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/auth/login');
}
