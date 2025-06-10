'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { cookies, headers } from 'next/headers'; // Import cookies and headers

// Helper function to get Supabase client
async function getSupabaseClient() {
  // createClient from @/lib/supabase/server handles cookies internally
  return createClient();
}

// DEPRECATED: Use getUser() instead for better security
// getSession() relies on potentially tampered cookies
export async function getSession() {
  console.warn('⚠️  SECURITY WARNING: getSession() is deprecated. Use getUser() instead.');
  const supabase = await getSupabaseClient();
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Error getting session:', error.message);
      return null;
    }
    return session;
  } catch (error: any) {
    console.error('Exception getting session:', error.message);
    return null;
  }
}

import type { User } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

type Profile = Database['public']['Tables']['profiles']['Row'];

export interface UserWithProfile extends User {
  profile?: Profile | null;
  isAdmin?: boolean;
}

export async function getUser(): Promise<UserWithProfile | null> {
  const supabase = await getSupabaseClient();
  try {
    // Use getUser() directly - it's more secure than getSession()
    // getUser() verifies with Supabase Auth server, while getSession() relies on cookies
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      // Return null silently - no auth session is normal for public pages
      return null;
    }

    // Fetch profile data
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error fetching profile:', profileError.message);
      return null;
    }

    return {
      ...user,
      profile: profile,
      isAdmin: profile?.role === 'admin'
    };
  } catch (error: any) {
    console.error('Exception getting user:', error.message);
    return null;
  }
}

// Legacy function for backwards compatibility
export async function getCurrentUser() {
  const user = await getUser();
  
  if (!user) {
    return { user: null, profile: null, isAdmin: false };
  }

  return {
    user: user,
    profile: user.profile,
    isAdmin: user.isAdmin || false
  };
}

export async function signOut() {
  const supabase = await getSupabaseClient(); // Use helper
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error.message);
      // Decide if redirect is still appropriate on error
    }
  } catch (error: any) {
    console.error('Exception signing out:', error.message);
  }
  // Redirect regardless of error to ensure user lands on login page
  return redirect('/auth/login');
}

// --- Add signIn and signInWithGoogle ---

export async function signIn(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const supabase = await getSupabaseClient();

  if (!email || !password) {
    return { error: 'Email and password are required.', success: false };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error('Sign in error:', error.message);
    // Provide a more user-friendly error message
    let userMessage = 'Invalid login credentials. Please try again.';
    if (error.message.includes('Email not confirmed')) {
      userMessage = 'Please confirm your email address before logging in.';
    }
    return { error: userMessage, success: false };
  }

  // Determine redirect path (e.g., based on role or query param)
  // For now, redirect to dashboard on success
  // Note: Redirects in server actions should ideally return an object
  // that the client component can use to perform the redirect.
  // Directly calling redirect() here might not work as expected from a form submission.
  // Let's return a success flag and redirect URL.
  // The middleware should handle the actual redirect after session is set.
  return { success: true, redirect: { destination: '/dashboard' } };
}

export async function signUp(formData: FormData) {
  const supabase = await getSupabaseClient();
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const full_name = formData.get('full_name') as string;

  if (!email || !password || !full_name) {
    return { 
      error: 'Please fill in all required fields.',
      success: false,
      data: null 
    };
  }

  try {
    // Create the user account
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: full_name,
          role: 'customer' // Set default role to customer
        }
      }
    });

    if (authError) {
      console.error('Auth signup error:', authError);
      return { 
        error: authError.message,
        success: false,
        data: null 
      };
    }

    if (!authData.user) {
      return { 
        error: 'Failed to create user account.',
        success: false,
        data: null 
      };
    }

    // Create the profile with customer role as default
    const { error: profileError } = await supabase.from('profiles').insert({
      id: authData.user.id,
      email: email,
      name: full_name,
      role: 'customer', // Default to customer role
      status: 'active'
    });

    if (profileError) {
      console.error('Profile creation error:', profileError);
      // Continue anyway, the profile might be created by a database trigger
    }

    return { 
      success: true, 
      error: null,
      data: authData.user,
      message: 'Account created successfully! Please check your email to verify your account.'
    };

  } catch (error: any) {
    console.error('Unexpected signup error:', error);
    return { 
      error: 'An unexpected error occurred. Please try again.',
      success: false,
      data: null 
    };
  }
}

export async function signInWithGoogle(origin: string) {
  const supabase = await getSupabaseClient();

  if (!origin) {
    return { error: 'Could not determine origin URL.', url: null };
  }

  // Determine the correct redirect URL based on environment
  const isLocal = origin.includes('localhost') || origin.includes('127.0.0.1');
  
  // Force production URLs in production environment
  let redirectTo;
  if (isLocal) {
    redirectTo = `${origin}/auth/callback`;
  } else {
    // In production, always use the production domain - hardcoded to prevent issues
    redirectTo = 'https://bettys-organic.com/auth/callback';
  }

  console.log('Google OAuth redirect URL:', redirectTo); // Debug log

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectTo,
    },
  });

  if (error) {
    console.error('Google sign in error:', error.message);
    return { error: 'Could not sign in with Google.', url: null };
  }

  // Return the URL for the client to redirect to
  return { error: null, url: data.url };
}
