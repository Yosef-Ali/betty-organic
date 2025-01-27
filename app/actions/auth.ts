import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { AuthError, AuthState, Profile } from '@/lib/types/auth';
import { User } from '@supabase/supabase-js';

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
      data: { user: supabaseUser },
      error,
    } = await supabase.auth.getUser();

    if (error || !supabaseUser) {
      console.error('Authentication error:', error);
      return null;
    }

    // Get profile data
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', supabaseUser.id)
      .single();

    // Create a proper User object
    const user: User = {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      role: supabaseUser.role || '',
      app_metadata: supabaseUser.app_metadata || {},
      user_metadata: supabaseUser.user_metadata || {},
      aud: supabaseUser.aud || '',
      created_at: supabaseUser.created_at || '',
      updated_at: supabaseUser.updated_at || '',
      phone: supabaseUser.phone || '',
      confirmed_at: supabaseUser.confirmed_at || '',
      confirmation_sent_at: supabaseUser.confirmation_sent_at || '',
      recovery_sent_at: supabaseUser.recovery_sent_at || '',
      last_sign_in_at: supabaseUser.last_sign_in_at || '',
      factors: supabaseUser.factors || [],
      identities: supabaseUser.identities || [],
    };

    const isAdmin = profile?.role === 'admin';
    return { user, profile, isAdmin };
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
    await supabase.auth.signOut();
    return redirect('/auth/login');
  } catch (error) {
    console.error('Sign out error:', error);
    return redirect('/auth/login');
  }
}
