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
// Using a shorter cache time to prevent stale data issues
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
      console.log('No session found for current user');
      return null;
    }

    // Get the user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (profileError) {
      // If profile doesn't exist, let's create a default one
      if (profileError.code === 'PGRST116') {
        console.log('Profile not found, creating default profile');
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert([
            {
              id: session.user.id,
              email: session.user.email,
              role: 'customer', // Default role
            },
          ])
          .select('*')
          .single();

        if (createError) {
          console.error('Error creating profile:', createError);
          return null;
        }

        return {
          user: session.user,
          profile: newProfile,
          isAdmin: newProfile.role === 'admin',
        };
      }

      console.error('Profile error:', profileError);
      return null;
    }

    // Return the user and profile
    return {
      user: session.user,
      profile,
      isAdmin: profile?.role === 'admin',
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
