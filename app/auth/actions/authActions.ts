'use server';

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

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
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (data?.url) {
    return {
      redirect: {
        destination: data.url,
        type: 'replace',
      },
    };
  }

  return { error: 'No redirect URL received from OAuth provider' };
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

  // Check for existing profile
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Profile lookup error:', error);
    return { error };
  }

  // Create profile if missing or update if needed
  if (!profile) {
    const { error: upsertError } = await supabase.from('profiles').upsert(
      {
        id: user.id,
        name: user.user_metadata?.full_name || user.email?.split('@')[0],
        email: user.email,
        role: 'customer',
        status: 'active',
        auth_provider: 'google',
        avatar_url: user.user_metadata?.avatar_url,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'id',
      },
    );

    if (upsertError) {
      console.error('Profile upsert error:', upsertError);
      return { error: upsertError };
    }
  }

  return { error: null };
}
