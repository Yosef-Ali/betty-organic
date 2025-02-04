'use server';

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import crypto from 'crypto';

// Helper function to create Supabase client with anon key
async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          const cookie = await cookieStore.get(name);
          return cookie?.value;
        },
        async set(name: string, value: string, options: CookieOptions) {
          await cookieStore.set(name, value, options);
        },
        async remove(name: string, options: CookieOptions) {
          await cookieStore.set(name, '', { ...options, maxAge: 0 });
        },
      },
    },
  );
}

export async function signIn(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  // Fetch user profile to preserve role
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user?.id)
    .single();
  if (!profileError && profileData) {
    const cookieStore = cookies();
    await cookieStore.set('userRole', profileData.role, {
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
  }

  return {
    redirect: {
      destination: '/dashboard',
      type: 'replace',
    },
  };
}

// Helper function to create Supabase admin client with service role key
async function createAdminClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        async get(name: string) {
          return cookieStore.get(name)?.value;
        },
        async set(name: string, value: string, options: CookieOptions) {
          cookieStore.set(name, value, options);
        },
        async remove(name: string, options: CookieOptions) {
          cookieStore.set(name, '', { ...options, maxAge: 0 });
        },
      },
    },
  );
}

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
          role: data.user_metadata?.role || 'customer',
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

export async function signInWithGoogle() {
  const supabase = await createClient();
  try {
    // First check if we have existing session
    const {
      data: { session: existingSession },
    } = await supabase.auth.getSession();
    if (existingSession) {
      await supabase.auth.signOut(); // Clear any existing session
    }

    // Get the current URL origin to handle both development and production
    let origin = process.env.NEXT_PUBLIC_SITE_URL;
    if (!origin) {
      // Fallback for development
      origin =
        process.env.NODE_ENV === 'production'
          ? 'https://betty-organic.vercel.app'
          : 'http://localhost:3000';
    }

    // Generate PKCE code verifier and challenge
    const codeVerifier = crypto.randomBytes(32).toString('hex');
    const codeChallenge = crypto
      .createHash('sha256')
      .update(codeVerifier)
      .digest('base64url');

    // Store code verifier in a cookie for the callback
    const cookieStore = cookies();
    await cookieStore.set('code_verifier', codeVerifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 5, // 5 minutes
      path: '/',
    });

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
          code_challenge: codeChallenge,
          code_challenge_method: 'S256',
        },
        scopes: 'email profile',
      },
    });

    if (error) {
      console.error('Google sign-in error:', error);
      return { error: error.message };
    }

    if (!data?.url) {
      console.error('No redirect URL received');
      return { error: 'Authentication configuration error' };
    }

    // Set the provider in a cookie instead of sessionStorage
    await cookieStore.set('authProvider', 'google', {
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 5, // 5 minutes
    });

    // Clear any existing Supabase cookies to ensure clean state
    cookieStore.set('sb-access-token', '', {
      path: '/',
      maxAge: -1,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
    cookieStore.set('sb-refresh-token', '', {
      path: '/',
      maxAge: -1,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    return {
      redirect: {
        destination: data.url,
        type: 'replace',
      },
    };
  } catch (err) {
    console.error('Unexpected error during Google sign-in:', err);
    return { error: 'An unexpected error occurred' };
  }
}

export async function signOut() {
  try {
    const supabase = await createClient();

    // Get the current session first
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return { success: true }; // Already signed out
    }

    // Clear session from Supabase
    const { error } = await supabase.auth.signOut();

    if (error) {
      return { error: error.message };
    }

    // Clear all Supabase session cookies
    const cookieStore = cookies();
    const supabaseCookies = [
      'sb-access-token',
      'sb-refresh-token',
      'sb-auth-token',
    ];
    for (const cookieName of supabaseCookies) {
      await cookieStore.set(cookieName, '', {
        maxAge: -1,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      });
    }

    return { success: true };
  } catch (err) {
    console.error('Sign out error:', err);
    return { error: 'Failed to sign out' };
  }
}

export async function resetPassword(email: string) {
  const supabase = createClient();
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

export async function verifyEmail(email: string, code: string) {
  const supabase = createAdminClient();

  // Check if verification code exists and is valid
  const { data: verificationData, error: verificationError } = await supabase
    .from('verification_codes')
    .select('*')
    .eq('email', email)
    .eq('code', code)
    .single();

  if (verificationError || !verificationData) {
    return { error: 'Invalid verification code' };
  }

  // Check if code has expired
  if (new Date(verificationData.expires_at) < new Date()) {
    return { error: 'Verification code has expired' };
  }

  // Update user's email verification status
  const { error: updateError } = await supabase.auth.admin.updateUserById(
    verificationData.user_id,
    { email_confirm: true },
  );

  if (updateError) {
    return { error: 'Failed to verify email' };
  }

  // Delete the used verification code
  await supabase
    .from('verification_codes')
    .delete()
    .eq('email', email)
    .eq('code', code);

  return {
    success: true,
    message: 'Email verified successfully',
  };
}

export async function createGoogleUserProfile(user: any) {
  const supabase = await createClient();

  try {
    // Check for existing profile first
    let existingProfile = null;
    const { data, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError && !data) {
      existingProfile = null;
    } else {
      existingProfile = data;
    }

    // Ensure we have valid user metadata
    const userMetadata = user.user_metadata || {};
    const fullName = userMetadata.full_name || userMetadata.name || user.email?.split('@')[0] || 'Unknown User';

    // Prepare profile data with all required fields
    const profileData = {
      id: user.id,
      name: fullName,
      email: user.email,
      role: existingProfile?.role || 'customer',
      status: 'active',
      auth_provider: 'google',
      avatar_url: userMetadata.avatar_url || userMetadata.picture || null,
      updated_at: new Date().toISOString(),
      created_at: existingProfile ? existingProfile.created_at : new Date().toISOString(),
      phone: existingProfile?.phone || null,
      address: existingProfile?.address || null
    };

    // Upsert the profile with all fields
    const { error: upsertError } = await supabase
      .from('profiles')
      .upsert(profileData, {
        onConflict: 'id',
        returning: 'minimal'
      });

    if (upsertError) {
      console.error('Profile upsert error:', upsertError);
      throw upsertError;
    }

    return { success: true };
  } catch (err) {
    console.error('Error in createGoogleUserProfile:', err);
    return { error: err.message || 'Failed to create user profile' };
  }
}
