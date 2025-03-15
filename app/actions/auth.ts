'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { AuthError, AuthState, Profile } from '@/lib/types/auth';
import { User } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export type AuthData = {
  user: User;
  profile: Profile;
  isAdmin: boolean;
} | null;

// Cache user data to avoid repeated database queries
export const getCurrentUser = cache(async (): Promise<AuthData> => {
  const supabase = await createClient();

  try {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('Session error:', sessionError);
      return null;
    }

    if (!session?.user) {
      return null;
    }

    // Get the user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (profileError) {
      console.error('Profile error:', profileError);
      return null;
    }

    return {
      user: session.user,
      profile,
      isAdmin: profile.role === 'admin',
    };
  } catch (error) {
    console.error('Auth error:', error);
    return null;
  }
});

// Helper functions for role checks
export async function isUserAdmin() {
  const authData = await getCurrentUser();
  return authData?.isAdmin || false;
}

export async function isSalesUser() {
  const authData = await getCurrentUser();
  return authData?.profile?.role === 'sales' || authData?.isAdmin || false;
}

export async function isCustomerUser() {
  const authData = await getCurrentUser();
  return authData?.profile?.role === 'customer' || false;
}

export async function signUp(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const full_name = formData.get("full_name") as string;

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name,
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, error: null };
}

export async function signIn(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  return { error: null, redirect: { destination: '/dashboard' } };
}

export async function signInWithGoogle() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?provider=google`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  return { error: null, url: data.url };
}
