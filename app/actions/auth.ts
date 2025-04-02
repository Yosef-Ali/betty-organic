'use server';

import { createClient as createClientServer } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { AuthError, Profile, AuthResponse } from '@/lib/types/auth';
import { User } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// Helper function to set cookies consistently
async function setCookie(name: string, value: string, options: { path: string; secure: boolean; sameSite: 'lax' | 'strict' | 'none'; maxAge: number; httpOnly: boolean }) {
  const cookieStore = await cookies();
  cookieStore.set(name, value, options);
}

export type AuthData = {
  user: User;
  profile: Profile;
  isAdmin: boolean;
} | null;

// Cache user data to avoid repeated database queries
// Using a shorter cache time to prevent stale data issues
export const getCurrentUser = cache(async (): Promise<AuthData> => {
  const supabase = await createClientServer();

  try {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      return null;
    }

    // Fetch the user's profile from the profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (profileError) {
      console.error('Profile error:', profileError);
      return null;
    }

    // Return the user and profile
    return {
      user: session.user,
      profile: profile as Profile,
      isAdmin: profile?.role === 'admin',
    };
  } catch (error) {
    console.error('Auth error:', error);
    return null;
  }
});

// Helper functions for role checks
export async function isUserAdmin() {
  const userData = await getCurrentUser();
  return userData?.profile?.role === 'admin';
}

export async function isSalesUser() {
  const userData = await getCurrentUser();
  return userData?.profile?.role === 'sales';
}

export async function isCustomerUser() {
  const userData = await getCurrentUser();
  return userData?.profile?.role === 'customer';
}

// Sign in with email and password
export async function signIn(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const supabase = await createClientServer();

  try {
    // Sign in with email and password
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { error: error.message };
    }

    if (!data?.user) {
      return { error: 'No user returned from authentication' };
    }

    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      console.error('Profile error:', profileError);
    }

    return {
      success: true,
      user: data.user,
      profile,
      redirect: {
        destination: '/',
        type: 'replace',
      },
    };
  } catch (error) {
    console.error('Sign in error:', error);
    return { error: 'An unexpected error occurred' };
  }
}

// Sign up with email and password
export async function signUp(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const full_name = formData.get('full_name') as string;

  const supabase = await createClientServer();

  // Create user with standard auth API
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: full_name,
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (data.user) {
    try {
      // Check if profile already exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', data.user.id)
        .single();

      if (!existingProfile) {
        // Create profile entry only if it doesn't exist
        const { error: profileError } = await supabase.from('profiles').insert({
          id: data.user.id,
          name: full_name,
          email: email,
          role: data.user?.user_metadata?.role || 'customer',
          status: 'active',
          auth_provider: 'email',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        if (profileError) {
          console.error('Failed to create profile:', profileError);
          return { error: 'Failed to create user profile' };
        }
      }

      return {
        success: true,
        message:
          'Registration successful. Please check your email for verification.',
        data: {
          user: {
            id: data.user.id,
            email: data.user.email,
            name: full_name,
            created_at: data.user.created_at,
          },
        },
      };
    } catch (err) {
      console.error('Error in registration process:', err);
      return { error: 'Failed to complete registration process' };
    }
  }

  return { error: 'Failed to create user' };
}

// Sign in with Google OAuth
export async function signInWithGoogle(returnTo?: string) {
  const supabase = await createClientServer();

  try {
    // Initiate Google sign in
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback${returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ''
          }`,
      },
    });

    if (error) {
      console.error('Google sign-in error:', error);
      return { error: error.message };
    }

    if (!data?.url) {
      console.error('No redirect URL received from Supabase');
      return { error: 'Authentication configuration error' };
    }

    // Return the URL for client-side redirect
    return { url: data.url };
  } catch (error) {
    console.error('Error in Google sign-in:', error);
    return { error: 'An unexpected error occurred' };
  }
}

// Sign out the current user
export async function signOut(): Promise<AuthResponse<null>> {
  try {
    const supabase = await createClientServer();

    // Sign out from Supabase
    const { error } = await supabase.auth.signOut();

    if (error) {
      return { error: error.message, success: false, data: null };
    }

    return {
      error: null,
      success: true,
      data: null,
      redirectTo: '/auth/login'
    };
  } catch (error) {
    console.error('Sign out error:', error);
    return {
      error: error instanceof Error ? error.message : 'Failed to sign out',
      success: false,
      data: null
    };
  }
}

// Reset password by sending a reset link
export async function resetPassword(formData: FormData) {
  const email = formData.get('email') as string;

  const supabase = await createClientServer();
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
    message: 'Password reset instructions have been sent to your email',
  };
}

// Update password after reset
export async function updatePassword(password: string) {
  const supabase = await createClientServer();

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
    message: 'Password updated successfully',
  };
}

// Create or update profile for Google authenticated users
export async function createGoogleUserProfile(user: { id: string; email: string; user_metadata?: Record<string, any> }) {
  const supabase = await createClientServer();

  try {
    // Check for existing profile first
    let existingProfile: Profile | null = null;
    const { data, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError && !data) {
      existingProfile = null;
    } else {
      existingProfile = data as Profile;
    }

    // Ensure we have valid user metadata
    const userMetadata = user.user_metadata || {};
    const fullName = userMetadata.full_name || userMetadata.name || user.email?.split('@')[0] || 'Unknown User';

    // Prepare profile data according to Profile interface
    const profileData: Profile = {
      id: user.id,
      name: fullName,
      email: user.email,
      role: existingProfile?.role || 'customer',
      status: 'active',
      auth_provider: 'google',
      avatar_url: userMetadata.avatar_url || userMetadata.picture || undefined,
      updated_at: new Date().toISOString(),
      created_at: existingProfile?.created_at || new Date().toISOString(),
      phone: existingProfile?.phone,
      address: existingProfile?.address
    };

    // Upsert the profile with all fields
    const { error: upsertError } = await supabase
      .from('profiles')
      .upsert(profileData, {
        onConflict: 'id'
      });

    if (upsertError) {
      console.error('Profile upsert error:', upsertError);
      throw upsertError;
    }

    return { success: true };
  } catch (err) {
    console.error('Error in createGoogleUserProfile:', err);
    return { error: err instanceof Error ? err.message : 'Failed to create user profile' };
  }
}

// Email verification
export async function verifyEmail(email: string, code: string) {
  const supabase = await createClientServer();

  try {
    // Instead of querying verification_codes table directly,
    // use the built-in Supabase auth verification API
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: 'email'
    });

    if (error) {
      console.error('Email verification error:', error);
      return { error: error.message || 'Failed to verify email' };
    }

    return {
      success: true,
      message: 'Email verified successfully',
    };
  } catch (err) {
    console.error('Unexpected error during email verification:', err);
    return {
      error: err instanceof Error ? err.message : 'An unexpected error occurred',
      success: false
    };
  }
}
