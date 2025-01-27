import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { AuthError, AuthState, Profile } from '@/lib/types/auth';
import { User } from '@supabase/supabase-js';

// Cache user data to avoid repeated database queries
export const getCurrentUser = cache(async () => {
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
      // Include any other User properties from supabaseUser
      ...supabaseUser,
    };

    return { user, profile };
  } catch (error) {
    console.error('Auth error:', error);
    const authError: AuthError = {
      type: 'UnexpectedError',
      message: 'An unexpected error occurred during authentication',
      details: { error },
    };
    throw authError;
  }
});

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
