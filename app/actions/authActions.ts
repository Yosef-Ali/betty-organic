'use server';

import { LoginFormType, ResetFormType } from 'lib/definitions';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';

// Improved type definitions
interface AuthResponse<T = unknown> {
  error: string | null;
  success: boolean;
  data: T | null;
  message?: string;
  redirectTo?: string;
}

interface SignupData {
  email: string;
  password: string;
  options: {
    data: {
      full_name: string;
    };
  };
}

export async function signup(formData: FormData): Promise<AuthResponse> {
  const supabase = createServerSupabaseClient();

  try {
    const { data: signupData, error } = await supabase.auth.signUp({
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      options: {
        data: {
          full_name: formData.get('full_name') as string,
          role: 'customer' // Set default role
        }
      }
    });

    if (error) {
      return {
        error: error.message,
        success: false,
        data: null
      };
    }

    if (signupData?.user) {
      // Create profile with default role
      await supabase.from('profiles').upsert({
        id: signupData.user.id,
        role: 'customer',
        updated_at: new Date().toISOString()
      });

      return {
        success: true,
        error: null,
        data: signupData,
        redirectTo: '/' // Redirect to homepage
      };
    }

    return {
      success: true,
      error: null,
      data: signupData,
      message: 'Please check your email to verify your account.'
    };

  } catch (error) {
    console.error('Signup error:', error);
    return {
      error: 'An unexpected error occurred',
      success: false,
      data: null
    };
  }
}

interface LoginResponse extends AuthResponse {
  role?: 'admin' | 'customer' | 'sales';
}

export async function login(formData: LoginFormType): Promise<LoginResponse> {
  try {
    const supabase = createServerSupabaseClient();

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    });

    if (authError) {
      return { error: authError.message, success: false, data: null };
    }

    if (!authData?.user) {
      return { error: 'Authentication failed', success: false, data: null };
    }

    // Fetch profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', authData.user.id)
      .single();

    const userRole = profile?.role || 'customer';

    // Create profile if it doesn't exist
    if (!profile) {
      await supabase
        .from('profiles')
        .upsert({
          id: authData.user.id,
          role: userRole,
          updated_at: new Date().toISOString()
        });
    }

    return {
      success: true,
      error: null,
      data: authData,
      role: userRole,
      redirectTo: userRole === 'admin' ? '/dashboard' : '/'
    };

  } catch (error) {
    console.error('Login error:', error);
    return { error: 'Login failed', success: false, data: null };
  }
}

export async function resetPassword(formData: ResetFormType): Promise<AuthResponse> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase.auth.resetPasswordForEmail(formData.email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?returnTo=/auth/login`,
    });

    if (error) {
      console.error('Password reset error:', error);
      throw new Error(`Password reset failed: ${error.message}`);
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

export async function signOut(): Promise<void> {
  const supabase = createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect('/auth/login');
}
