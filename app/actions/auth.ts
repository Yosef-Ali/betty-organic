'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { AuthError, AuthState, Profile } from '@/lib/types/auth';
import { User } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

type AuthData = {
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

export async function signOut() {
  try {
    const supabase = await createClient();

    // Sign out from Supabase - this will automatically handle cookie cleanup
    await supabase.auth.signOut();

    // Redirect to login page
    return redirect('/auth/login');
  } catch (error) {
    console.error('Sign out error:', error);
    return redirect('/auth/login');
  }
}
