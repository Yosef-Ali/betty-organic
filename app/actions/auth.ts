'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { AuthError, Profile, AuthResponse } from '@/lib/types/auth';
import { Database } from '@/types/supabase';
import type { User } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// Database types
import type { SupabaseClient } from '@supabase/supabase-js';

// Database types
type Tables = Database['public']['Tables'];
type Profiles = Tables['profiles'];
type ProfileRow = Profiles['Row'];
type ProfileInsert = Profiles['Insert'];

// Role type
type UserRole = 'admin' | 'sales' | 'customer';

// Utility type for database operations
type DbClient = SupabaseClient<Database>;

// Default profile data
const baseProfile = {
  role: 'customer' as UserRole,
  status: 'active' as const,
  auth_provider: null,
  avatar_url: null
} as const;

// Type-safe database helper
const createProfileQuery = (supabase: DbClient) => ({
  findById: (id: string) =>
    supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single<ProfileRow>(),

  insert: (data: ProfileInsert) =>
    supabase
      .from('profiles')
      .insert([data])
      .single(),

  upsert: (data: ProfileInsert) =>
    supabase
      .from('profiles')
      .upsert([data], { onConflict: 'id' })
      .single()
});

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
  const supabase = await createClient();

  try {
    // Use getUser instead of getSession for better security
    // getUser verifies with the Supabase Auth server
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return null;
    }

    // Fetch the user's profile from the profiles table
    // Use a safe type casting approach for the Supabase client
    const supabaseTyped = supabase as unknown as DbClient;
    const profileQuery = createProfileQuery(supabaseTyped);
    const { data: profile, error: profileError } = await profileQuery.findById(user.id);

    if (profileError || !profile) {
      console.error('Profile error:', profileError);
      return null;
    }

    // Type-safe profile creation with validation
    if (!profile.role || !['admin', 'sales', 'customer'].includes(profile.role)) {
      console.error('Invalid profile role:', profile.role);
      return null;
    }

    // Construct userProfile safely after validation
    const userProfile: Profile = {
      ...profile, // Spread base properties
      role: profile.role as 'admin' | 'sales' | 'customer', // Type assertion to ensure correct union type
      // Assign other potentially null fields safely
      phone: profile.phone || null,
      address: profile.address || null
    };

    return {
      user,
      profile: userProfile,
      isAdmin: userProfile.role === 'admin',
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

  const supabase = await createClient();

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
    // Use a safe type casting approach for the Supabase client
    const supabaseTyped = supabase as unknown as DbClient;
    const profileQuery = createProfileQuery(supabaseTyped);
    const { data: profileResult, error: profileFetchError } = await profileQuery.findById(data.user.id);

    if (profileFetchError) {
      console.error('Profile fetch error in signIn:', profileFetchError);
      // Decide how to handle profile fetch error - return error, null profile, etc.
      // For now, returning null profile if fetch failed or role is invalid
    }

    // Validate the fetched profile role
    let validatedProfile: Profile | null = null;
    if (profileResult && profileResult.role && ['admin', 'sales', 'customer'].includes(profileResult.role)) {
      validatedProfile = {
        ...profileResult,
        role: profileResult.role as 'admin' | 'sales' | 'customer',
        phone: profileResult.phone || null,
        address: profileResult.address || null,
      };
    } else if (profileResult) {
      console.warn(`Invalid or missing role ('${profileResult.role}') for user ${data.user.id} during sign in.`);
      // Optionally handle this case, e.g., assign default role or return error
    }


    return {
      success: true,
      user: data.user,
      profile: validatedProfile, // Return the validated (or null) profile
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

  const supabase = await createClient();

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
      // Use safer type casting for the query
      const supabaseTyped = supabase as unknown as DbClient;
      const { data: existingProfile } = await supabaseTyped
        .from('profiles')
        .select('id')
        .eq('id', data.user.id)
        .single<ProfileRow>();

      if (!existingProfile) {
        // Create profile entry only if it doesn't exist
        const profileData: ProfileInsert = {
          id: data.user.id,
          email: email,
          name: full_name,
          role: 'customer',
          status: 'active',
          auth_provider: 'email',
          avatar_url: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        // Use the same safe type casting approach here
        const { error: profileError } = await supabaseTyped
          .from('profiles')
          .insert([profileData]);

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
  const supabase = await createClient();

  try {
    // Initiate Google sign in
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback${returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ''}`
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
    const supabase = await createClient();

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

  const supabase = await createClient();
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
  const supabase = await createClient();

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
  const supabase = await createClient();

  try {
    // Check for existing profile first
    // Use a safe type casting approach for the Supabase client
    const supabaseTyped = supabase as unknown as DbClient;
    const profileQuery = createProfileQuery(supabaseTyped);
    // Fetch raw profile data (ProfileRow)
    const { data: existingProfileData, error: profileFetchError } = await profileQuery.findById(user.id);

    if (profileFetchError && profileFetchError.code !== 'PGRST116') { // Ignore 'not found' error
      console.error("Error fetching existing profile:", profileFetchError);
      // Handle fetch error appropriately, maybe throw or return error
    }
    // existingProfileData is ProfileRow | null here

    // Ensure we have valid user metadata
    const userMetadata = user.user_metadata || {};
    const fullName = userMetadata.full_name || userMetadata.name || user.email?.split('@')[0] || 'Unknown User';

    // Prepare profile data according to Profile interface
    // Validate the role from the fetched data (if any)
    let roleToSet: UserRole = 'customer'; // Default to customer
    if (existingProfileData?.role && ['admin', 'sales', 'customer'].includes(existingProfileData.role)) {
      // Role is valid, use it
      roleToSet = existingProfileData.role as UserRole;
    } else if (existingProfileData?.role) {
      // Role exists but is invalid, warn and use default
      console.warn(`Invalid existing role ('${existingProfileData.role}') found for Google user ${user.id}. Defaulting to 'customer'.`);
    }
    // If no existing profile or role is null, 'customer' default is used.

    // Create strict-typed profile data for upsert
    const profileToUpsert: ProfileInsert = {
      id: user.id,
      email: user.email,
      name: fullName,
      role: roleToSet, // Use the validated or default role
      status: 'active',
      auth_provider: 'google',
      avatar_url: userMetadata.avatar_url || userMetadata.picture || null,
      updated_at: new Date().toISOString(),
      // Ensure created_at is a string or undefined/null as expected by ProfileInsert
      created_at: existingProfileData?.created_at ?? new Date().toISOString()
    };

    // Upsert the profile with all fields
    const { error: upsertError } = await profileQuery.upsert(profileToUpsert);

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
  const supabase = await createClient();

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
