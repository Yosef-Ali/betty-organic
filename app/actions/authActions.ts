'use server';

import { LoginFormType, ResetFormType } from 'lib/definitions';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

interface AuthResponse {
  error: null | string;
  success: boolean;
  data: unknown | null;
  message?: string;  // Add optional message property
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
  const { data: signupData, error } = await supabase.auth.signUp(data);

  if (error) {
    return {
      error: error.message,
      success: false,
      data: null
    };
  }

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
}

export async function login(formData: LoginFormType) {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.email,
    password: formData.password,
  });

  if (error) {
    return { error: error.message };
  }

  redirect('/');
}

export async function resetPassword(formData: ResetFormType) {
  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?returnTo=/auth/login`,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/auth/login');
}
